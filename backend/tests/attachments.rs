use std::{io::Cursor, path::PathBuf, sync::Arc, time::Duration};
use yrkie_backend::{attachments, db};

fn setup() -> (PathBuf, Arc<attachments::Repository>) {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../test/20261019-attachments")
        .join(uuid::Uuid::new_v4().to_string());
    let repository = Arc::new(attachments::Repository::open(&root).expect("attachment repository"));
    (root, repository)
}
fn project(c: &rusqlite::Connection) -> String {
    let id = format!("srv-{}", uuid::Uuid::new_v4());
    c.execute("INSERT INTO projects(id,title,prompt,status) VALUES(?1,'Attachment test','Use the source document','draft')",[&id]).unwrap();
    id
}
fn ready_document(root: &std::path::Path, id: &str, text: &str) {
    let c = db::connect(&root.join("yrkie.sqlite3")).unwrap();
    c.execute("UPDATE uploads SET status='ready',parsed_markdown=?2,content_chars=?3,estimated_tokens=2 WHERE upload_id=?1",rusqlite::params![id,text,text.chars().count()]).unwrap();
}

#[test]
fn idempotency_cancellation_and_pending_attachment_admission() {
    let (root, r) = setup();
    let first = r
        .start(
            "draft-a",
            "upload-a",
            "source.txt",
            Some("text/plain"),
            b"actual document",
        )
        .unwrap();
    assert_eq!(
        r.start(
            "draft-a",
            "upload-a",
            "source.txt",
            Some("text/plain"),
            b"actual document"
        )
        .unwrap()
        .upload_id,
        first.upload_id
    );
    assert_eq!(
        r.start(
            "draft-a",
            "upload-a",
            "source.txt",
            Some("text/plain"),
            b"different"
        )
        .unwrap_err()
        .status,
        409
    );
    let c = db::connect(&root.join("yrkie.sqlite3")).unwrap();
    let p = project(&c);
    assert_eq!(
        attachments::attach_to_project(&c, &p, &[first.upload_id.clone()])
            .unwrap_err()
            .status,
        409
    );
    r.cancel("draft-a", "upload-a").unwrap();
    assert!(r.get(&first.upload_id).is_err());
    assert_eq!(
        r.start(
            "draft-a",
            "upload-a",
            "source.txt",
            None,
            b"actual document"
        )
        .unwrap_err()
        .status,
        409
    );
    r.cancel("draft-late", "late-a").unwrap();
    assert!(
        r.start(
            "draft-late",
            "late-a",
            "late.txt",
            None,
            b"cancel before post"
        )
        .is_err()
    );
}

#[test]
fn bound_document_context_is_complete_and_fenced_to_project() {
    let (root, r) = setup();
    let upload = r
        .start(
            "draft-b",
            "upload-b",
            "中文资料.txt",
            Some("text/plain"),
            "确切来源\nsecond line\nthird line".as_bytes(),
        )
        .unwrap();
    ready_document(
        &root,
        &upload.upload_id,
        "确切来源\nsecond line\nthird line",
    );
    let mut c = db::connect(&root.join("yrkie.sqlite3")).unwrap();
    let p = project(&c);
    let other = project(&c);
    let tx = c.transaction().unwrap();
    attachments::attach_to_project(&tx, &p, &[upload.upload_id.clone()]).unwrap();
    tx.commit().unwrap();
    let context = r.context_for_project(&p).unwrap();
    assert_eq!(
        context[0].markdown.as_deref(),
        Some("确切来源\nsecond line\nthird line")
    );
    let page = r.read_for_project(&p, &upload.upload_id, 2, 1).unwrap();
    assert_eq!(page.markdown, "second line\n");
    assert!(page.truncated);
    assert_eq!(page.total_lines, 3);
    assert!(
        r.read_for_project(&other, &upload.upload_id, 1, 100)
            .is_err()
    );
    assert!(attachments::attach_to_project(&c, &other, &[upload.upload_id.clone()]).is_err());
    assert_eq!(r.delete(&upload.upload_id).unwrap_err().status, 409);
    assert!(r.original_for_project(&other, &upload.upload_id).is_err());
    assert!(r.list("draft-b").unwrap().is_empty());
    for index in 0..8 {
        r.start(
            "draft-b",
            &format!("next-{index}"),
            "source.txt",
            Some("text/plain"),
            b"next source",
        )
        .unwrap();
    }
}

#[tokio::test]
async fn real_image_decodes_and_becomes_an_authorized_slide_asset() {
    let (root, r) = setup();
    let mut bytes = Cursor::new(Vec::new());
    image::DynamicImage::new_rgb8(8, 6)
        .write_to(&mut bytes, image::ImageFormat::Png)
        .unwrap();
    let upload = r
        .start(
            "draft-image",
            "image-a",
            "reference.png",
            Some("image/png"),
            bytes.get_ref(),
        )
        .unwrap();
    r.spawn(&upload.upload_id);
    let mut complete = None;
    for _ in 0..100 {
        let row = r.get(&upload.upload_id).unwrap();
        if row.status != "processing" {
            complete = Some(row);
            break;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    let ready = complete.expect("image processing finishes");
    assert_eq!(ready.status, "ready");
    assert_eq!(ready.width, Some(8));
    assert_eq!(ready.height, Some(6));
    assert!(
        ready
            .asset_reference
            .as_deref()
            .unwrap()
            .starts_with("yrkie-asset-data://")
    );
    let c = db::connect(&root.join("yrkie.sqlite3")).unwrap();
    let p = project(&c);
    attachments::attach_to_project(&c, &p, &[ready.upload_id.clone()]).unwrap();
    let count: u64 = c
        .query_row(
            "SELECT count(*) FROM project_assets WHERE project_id=?1",
            [&p],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(count, 1);
    let media = r.media_for_project(&p, &ready.upload_id).unwrap();
    assert_eq!(media.mime, "image/png");
    assert_eq!(image::load_from_memory(&media.bytes).unwrap().width(), 8);
}

#[tokio::test]
async fn corrupt_image_fails_without_becoming_a_slide_asset() {
    let (root, r) = setup();
    let upload = r
        .start(
            "draft-corrupt",
            "image-b",
            "broken.png",
            Some("image/png"),
            b"\x89PNG\r\n\x1a\nnot-an-image",
        )
        .unwrap();
    r.spawn(&upload.upload_id);
    for _ in 0..100 {
        let row = r.get(&upload.upload_id).unwrap();
        if row.status != "processing" {
            assert_eq!(row.status, "failed");
            assert_eq!(row.error_code, "invalid_image");
            assert!(!row.retryable);
            let c = db::connect(&root.join("yrkie.sqlite3")).unwrap();
            let count: u64 = c
                .query_row("SELECT count(*) FROM assets", [], |r| r.get(0))
                .unwrap();
            assert_eq!(count, 0);
            return;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    panic!("corrupt image processing did not finish");
}

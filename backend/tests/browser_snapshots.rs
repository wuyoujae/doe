use base64::Engine;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::io::Cursor;
use yrkie_backend::{assets, db, projects};

fn deck(reference: Option<&str>) -> Value {
    json!({"version":4,"pageNumber":{"enabled":true,"format":"number"},"deck":{
        "title":"Browser draft","theme":"yrkie-theme","slides":[{"id":"page-one","size":{"width":960,"height":540,"unit":"pt"},
        "blocks":reference.map(|src| vec![json!({"id":"image-one","type":"image","props":{"src":src}})]).unwrap_or_default()}]}})
}
fn request(
    source: &str,
    revision: u64,
    deck: Value,
    images: Value,
) -> projects::BrowserSnapshotInput {
    serde_json::from_value(json!({"sourceId":source,"sourceRevision":revision,"prompt":"An existing browser draft","deck":deck,"assets":images})).unwrap()
}
fn setup() -> (std::path::PathBuf, projects::Repository, assets::Repository) {
    let directory = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../test/20261019-original-core/browser-snapshots")
        .join(uuid::Uuid::new_v4().to_string());
    let projects = projects::Repository::open(&directory).unwrap();
    let assets = assets::Repository::open(&directory).unwrap();
    (directory, projects, assets)
}

#[test]
fn browser_snapshot_is_idempotent_and_does_not_replace_the_draft_or_recent_projects() {
    let (_, projects, assets) = setup();
    let source = uuid::Uuid::new_v4().to_string();
    let first = projects
        .browser_snapshot(request(&source, 7, deck(None), json!([])), &assets)
        .unwrap();
    let replay = projects
        .browser_snapshot(request(&source, 7, deck(None), json!([])), &assets)
        .unwrap();
    assert_eq!(first.project_id, replay.project_id);
    assert_eq!(first.revision, 1);
    assert_eq!(
        projects
            .read(&first.project_id)
            .unwrap()
            .schema_deck
            .unwrap()
            .deck,
        deck(None)
    );
    assert!(projects.list().unwrap().is_empty());
    let mut changed = deck(None);
    changed["deck"]["title"] = json!("Later draft");
    assert!(matches!(
        projects.browser_snapshot(request(&source, 7, changed.clone(), json!([])), &assets),
        Err(projects::Error::Idempotency)
    ));
    let next = projects
        .browser_snapshot(request(&source, 8, changed, json!([])), &assets)
        .unwrap();
    assert_ne!(first.project_id, next.project_id);
    assert_eq!(
        projects.read(&first.project_id).unwrap().title,
        "Browser draft"
    );
}

#[test]
fn browser_images_are_checked_and_bound_with_the_deck_in_one_transaction() {
    let (directory, projects, assets) = setup();
    let source = uuid::Uuid::new_v4().to_string();
    let mut output = Cursor::new(Vec::new());
    image::DynamicImage::new_rgb8(8, 8)
        .write_to(&mut output, image::ImageFormat::Png)
        .unwrap();
    let bytes = output.into_inner();
    let id = format!("{:x}", Sha256::digest(&bytes));
    let reference = format!("yrkie-asset-data://{id}");
    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
    assert!(
        projects
            .browser_snapshot(
                request(&source, 1, deck(Some(&reference)), json!([])),
                &assets
            )
            .is_err()
    );
    let connection = db::connect(&directory.join("yrkie.sqlite3")).unwrap();
    assert_eq!(
        connection
            .query_row("SELECT count(*) FROM projects", [], |row| row
                .get::<_, u64>(0))
            .unwrap(),
        0
    );
    assert!(
        projects
            .browser_snapshot(
                request(
                    &source,
                    1,
                    deck(Some(&reference)),
                    json!([{"assetId":"0".repeat(64),"base64":encoded}])
                ),
                &assets
            )
            .is_err()
    );
    let saved = projects
        .browser_snapshot(
            request(
                &source,
                1,
                deck(Some(&reference)),
                json!([{"assetId":id,"base64":encoded}]),
            ),
            &assets,
        )
        .unwrap();
    assert_eq!(assets.read(&saved.project_id, &id).unwrap().bytes, bytes);
}

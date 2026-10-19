use super::{
    AttachmentBytes, Error, MAX_ATTACHMENTS, MAX_FILE_BYTES, ReadDocumentResult, UploadRecord,
    validation,
};
use crate::db;
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use sha2::{Digest, Sha256};
use std::{
    collections::HashSet,
    io::Write,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};

pub struct Repository {
    pub(crate) path: PathBuf,
    pub(crate) root: PathBuf,
    pub(crate) active: Mutex<HashSet<String>>,
    pub(crate) slots: Arc<tokio::sync::Semaphore>,
    pub(crate) image_slots: Arc<tokio::sync::Semaphore>,
}
const COLUMNS: &str = "upload_id,client_upload_id,draft_id,project_id,pipeline,status,original_name,detected_type,mime_type,size_bytes,content_chars,estimated_tokens,warnings_json,width,height,created_at,updated_at,error_code,error_message,retryable,sha256";
fn row(r: &rusqlite::Row<'_>) -> rusqlite::Result<UploadRecord> {
    Ok(UploadRecord {
        upload_id: r.get(0)?,
        client_upload_id: r.get(1)?,
        draft_id: r.get(2)?,
        project_id: r.get(3)?,
        pipeline: r.get(4)?,
        status: r.get(5)?,
        original_name: r.get(6)?,
        detected_type: r.get(7)?,
        mime_type: r.get(8)?,
        size_bytes: r.get(9)?,
        content_chars: r.get(10)?,
        estimated_tokens: r.get(11)?,
        warnings: serde_json::from_str(&r.get::<_, String>(12)?).unwrap_or_default(),
        width: r.get(13)?,
        height: r.get(14)?,
        created_at: r.get(15)?,
        updated_at: r.get(16)?,
        error_code: r.get(17)?,
        error_message: r.get(18)?,
        retryable: r.get(19)?,
        asset_reference: if r.get::<_, String>(4)? == "image" && r.get::<_, String>(5)? == "ready" {
            Some(format!("yrkie-asset-data://{}", r.get::<_, String>(20)?))
        } else {
            None
        },
    })
}
fn record(c: &Connection, id: &str) -> Result<UploadRecord, Error> {
    c.query_row(
        &format!("SELECT {COLUMNS} FROM uploads WHERE upload_id=?1 AND status!='deleted'"),
        [id],
        row,
    )
    .optional()?
    .ok_or_else(Error::not_found)
}
fn identifier(id: &str) -> Result<(), Error> {
    validation::validate_client_id(id, "uploadId")?;
    if !id.starts_with("upload-") || uuid::Uuid::parse_str(&id[7..]).is_err() {
        return Err(Error::not_found());
    }
    Ok(())
}
impl Repository {
    pub fn open(data_dir: &Path) -> Result<Self, Error> {
        let root = data_dir.join("attachments");
        std::fs::create_dir_all(&root)?;
        let path = data_dir.join("yrkie.sqlite3");
        let mut c = db::connect(&path)?;
        db::migrate(&mut c).map_err(|_| Error::internal())?;
        Ok(Self {
            path,
            root,
            active: Mutex::new(HashSet::new()),
            slots: Arc::new(tokio::sync::Semaphore::new(1)),
            image_slots: Arc::new(tokio::sync::Semaphore::new(2)),
        })
    }
    pub fn get(&self, id: &str) -> Result<UploadRecord, Error> {
        identifier(id)?;
        record(&db::connect(&self.path)?, id)
    }
    pub fn list(&self, draft_id: &str) -> Result<Vec<UploadRecord>, Error> {
        validation::validate_client_id(draft_id, "draftId")?;
        let c = db::connect(&self.path)?;
        let mut q=c.prepare(&format!("SELECT {COLUMNS} FROM uploads WHERE draft_id=?1 AND project_id IS NULL AND status!='deleted' ORDER BY created_at,upload_id"))?;
        Ok(q.query_map([draft_id], row)?
            .collect::<Result<Vec<_>, _>>()?)
    }
    pub fn list_for_project(&self, project: &str) -> Result<Vec<UploadRecord>, Error> {
        let c = db::connect(&self.path)?;
        let mut q=c.prepare(&format!("SELECT {COLUMNS} FROM uploads WHERE project_id=?1 AND status='ready' ORDER BY created_at,upload_id"))?;
        Ok(q.query_map([project], row)?
            .collect::<Result<Vec<_>, _>>()?)
    }
    pub fn image_context(&self, project: &str) -> Result<Vec<UploadRecord>, Error> {
        Ok(self
            .list_for_project(project)?
            .into_iter()
            .filter(|r| r.pipeline == "image")
            .collect())
    }
    pub fn context_for_project(
        &self,
        project: &str,
    ) -> Result<Vec<super::types::AttachmentContext>, Error> {
        let c = db::connect(&self.path)?;
        let mut result = Vec::new();
        for upload in self.list_for_project(project)? {
            let markdown = if upload.pipeline == "document" {
                Some(c.query_row(
                    "SELECT parsed_markdown FROM uploads WHERE upload_id=?1",
                    [&upload.upload_id],
                    |r| r.get(0),
                )?)
            } else {
                None
            };
            result.push(super::types::AttachmentContext { upload, markdown });
        }
        Ok(result)
    }
    pub fn start(
        &self,
        draft: &str,
        client_id: &str,
        name: &str,
        mime: Option<&str>,
        bytes: &[u8],
    ) -> Result<UploadRecord, Error> {
        let draft = validation::validate_client_id(draft, "draftId")?;
        let client_id = validation::validate_client_id(client_id, "clientUploadId")?;
        let name = validation::normalize_original_name(name)?;
        let classified = validation::classify_upload(
            &name,
            mime,
            &bytes[..bytes.len().min(1024)],
            bytes.len() as u64,
        )?;
        if !matches!(
            classified.pipeline,
            super::types::UploadPipeline::Document | super::types::UploadPipeline::Image
        ) {
            return Err(Error::validation(
                "unsupported_file_type",
                "This local edition supports documents and images. Audio/video require a compatible media model and are not enabled.",
            ));
        }
        let digest = format!("{:x}", Sha256::digest(bytes));
        // Flush the immutable file before taking SQLite's writer lock; OCR and
        // model-stream commits must not wait on a large attachment disk write.
        let id = format!("upload-{}", uuid::Uuid::new_v4());
        let file = self.root.join(format!("{id}.blob"));
        let mut output = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&file)?;
        let mut staged = StagedFile {
            path: file,
            committed: false,
        };
        let written = output.write_all(bytes).and_then(|_| output.sync_all());
        drop(output);
        written?;
        let mut c = db::connect(&self.path)?;
        let tx = c.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let cancelled:bool=tx.query_row("SELECT EXISTS(SELECT 1 FROM upload_cancellations WHERE draft_id=?1 AND client_upload_id=?2)",params![draft,client_id],|r|r.get(0))?;
        if cancelled {
            return Err(Error::conflict(
                "The attachment upload was cancelled. Select the file again to upload it.",
            ));
        }
        let existing:Option<(String,String,String)>=tx.query_row("SELECT upload_id,sha256,original_name FROM uploads WHERE draft_id=?1 AND client_upload_id=?2",params![draft,client_id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?))).optional()?;
        if let Some((id, hash, old_name)) = existing {
            if hash != digest || old_name != name {
                return Err(Error::conflict(
                    "This upload request id has already been used for a different file.",
                ));
            }
            let result = record(&tx, &id)?;
            tx.commit()?;
            return Ok(result);
        }
        let count: u64 = tx.query_row(
            "SELECT count(*) FROM uploads WHERE draft_id=?1 AND project_id IS NULL AND status!='deleted'",
            [&draft],
            |r| r.get(0),
        )?;
        if count >= MAX_ATTACHMENTS as u64 {
            return Err(Error::validation(
                "too_many_attachments",
                "A message can include up to eight attachments.",
            ));
        }
        tx.execute("INSERT INTO uploads(upload_id,client_upload_id,draft_id,pipeline,status,original_name,detected_type,mime_type,size_bytes,sha256) VALUES(?1,?2,?3,?4,'processing',?5,?6,?7,?8,?9)",params![id,client_id,draft,classified.pipeline.as_str(),name,classified.detected_type,classified.mime_type,bytes.len() as u64,digest])?;
        let result = record(&tx, &id)?;
        tx.commit()?;
        staged.committed = true;
        Ok(result)
    }
    pub fn retry(&self, id: &str) -> Result<UploadRecord, Error> {
        identifier(id)?;
        let mut c = db::connect(&self.path)?;
        let tx = c.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let current = record(&tx, id)?;
        if current.status == "failed" {
            if !current.retryable {
                return Err(Error::conflict(
                    "This file could not be parsed. Select a corrected file.",
                ));
            }
            tx.execute("UPDATE uploads SET status='processing',attempt=attempt+1,error_code='',error_message='',retryable=0,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE upload_id=?1",[id])?;
        }
        let result = record(&tx, id)?;
        tx.commit()?;
        Ok(result)
    }
    pub fn delete(&self, id: &str) -> Result<(), Error> {
        identifier(id)?;
        let c = db::connect(&self.path)?;
        let identifiers: Option<(String, String)> = c
            .query_row(
                "SELECT draft_id,client_upload_id FROM uploads WHERE upload_id=?1",
                [id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .optional()?;
        if let Some((draft, client)) = identifiers {
            self.cancel(&draft, &client)?
        }
        Ok(())
    }
    pub fn cancel(&self, draft: &str, client: &str) -> Result<(), Error> {
        validation::validate_client_id(draft, "draftId")?;
        validation::validate_client_id(client, "clientUploadId")?;
        let mut c = db::connect(&self.path)?;
        let tx = c.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let row:Option<(String,Option<String>)>=tx.query_row("SELECT upload_id,project_id FROM uploads WHERE draft_id=?1 AND client_upload_id=?2",params![draft,client],|r|Ok((r.get(0)?,r.get(1)?))).optional()?;
        if row.as_ref().is_some_and(|r| r.1.is_some()) {
            return Err(Error::conflict(
                "An attachment already used in a project cannot be removed from its history.",
            ));
        }
        tx.execute(
            "INSERT OR IGNORE INTO upload_cancellations(draft_id,client_upload_id) VALUES(?1,?2)",
            params![draft, client],
        )?;
        tx.execute("UPDATE uploads SET status='deleted',attempt=attempt+1,parsed_markdown='',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE draft_id=?1 AND client_upload_id=?2",params![draft,client])?;
        tx.commit()?;
        if let Some((id, _)) = row {
            let _ = std::fs::remove_file(self.root.join(format!("{id}.blob")));
        }
        Ok(())
    }
    pub fn recover_interrupted(&self) -> Result<Vec<String>, Error> {
        let c = db::connect(&self.path)?;
        let mut q = c.prepare(
            "SELECT upload_id FROM uploads WHERE status='processing' ORDER BY created_at",
        )?;
        Ok(q.query_map([], |r| r.get(0))?
            .collect::<Result<Vec<_>, _>>()?)
    }
    pub fn read_for_project(
        &self,
        project: &str,
        id: &str,
        start_line: usize,
        line_count: usize,
    ) -> Result<ReadDocumentResult, Error> {
        if start_line == 0 || line_count == 0 || line_count > 200 {
            return Err(Error::validation(
                "invalid_attachment_range",
                "startLine must be at least one and lineCount must be between one and 200.",
            ));
        }
        let r = self.get(id)?;
        if r.project_id.as_deref() != Some(project)
            || r.status != "ready"
            || r.pipeline != "document"
        {
            return Err(Error::not_found());
        }
        let c = db::connect(&self.path)?;
        let text: String = c.query_row(
            "SELECT parsed_markdown FROM uploads WHERE upload_id=?1",
            [id],
            |r| r.get(0),
        )?;
        let lines: Vec<_> = text.lines().collect();
        if start_line > lines.len().saturating_add(1) {
            return Err(Error::validation(
                "invalid_attachment_range",
                "The requested line is beyond the end of the document.",
            ));
        }
        let mut output = String::new();
        let mut consumed = 0;
        let mut truncated = false;
        for line in lines.iter().skip(start_line - 1).take(line_count) {
            let available = (64 * 1024usize).saturating_sub(output.len());
            if available == 0 {
                truncated = true;
                break;
            }
            if line.len() + 1 > available {
                let mut end = available.saturating_sub(1).min(line.len());
                while !line.is_char_boundary(end) {
                    end -= 1;
                }
                output.push_str(&line[..end]);
                truncated = true;
                break;
            }
            output.push_str(line);
            output.push('\n');
            consumed += 1;
        }
        Ok(ReadDocumentResult {
            upload_id: id.into(),
            file_name: r.original_name,
            markdown: output,
            start_line,
            end_line: start_line.saturating_add(consumed).saturating_sub(1),
            total_lines: lines.len(),
            truncated: truncated || start_line.saturating_sub(1) + consumed < lines.len(),
        })
    }
    pub fn original_for_project(&self, project: &str, id: &str) -> Result<AttachmentBytes, Error> {
        let r = self.get(id)?;
        if r.project_id.as_deref() != Some(project) || r.status != "ready" {
            return Err(Error::not_found());
        }
        let bytes = self.read_managed(&r)?;
        Ok(AttachmentBytes {
            bytes,
            mime: r.mime_type,
        })
    }
    pub fn media_for_project(&self, project: &str, id: &str) -> Result<AttachmentBytes, Error> {
        let r = self.get(id)?;
        if r.project_id.as_deref() != Some(project) || r.status != "ready" || r.pipeline != "image"
        {
            return Err(Error::not_found());
        }
        let bytes = self.read_managed(&r)?;
        let image = super::service::decode_image(&bytes)?;
        let mut encoded = std::io::Cursor::new(Vec::new());
        image
            .write_to(&mut encoded, image::ImageFormat::Png)
            .map_err(|_| Error::validation("invalid_image", "The image could not be decoded."))?;
        if encoded.get_ref().len() > MAX_FILE_BYTES {
            return Err(Error::validation(
                "image_too_large",
                "The decoded image exceeds the model attachment limit.",
            ));
        }
        Ok(AttachmentBytes {
            bytes: encoded.into_inner(),
            mime: "image/png".into(),
        })
    }
    pub(crate) fn read_managed(&self, r: &UploadRecord) -> Result<Vec<u8>, Error> {
        identifier(&r.upload_id)?;
        let path = self.root.join(format!("{}.blob", r.upload_id));
        let metadata = std::fs::symlink_metadata(&path)?;
        if !metadata.is_file()
            || metadata.file_type().is_symlink()
            || metadata.len() != r.size_bytes
            || metadata.len() > MAX_FILE_BYTES as u64
        {
            return Err(Error::internal());
        }
        let bytes = std::fs::read(path)?;
        let digest: String = db::connect(&self.path)?.query_row(
            "SELECT sha256 FROM uploads WHERE upload_id=?1",
            [&r.upload_id],
            |row| row.get(0),
        )?;
        if bytes.len() as u64 != r.size_bytes || format!("{:x}", Sha256::digest(&bytes)) != digest {
            return Err(Error::internal());
        }
        Ok(bytes)
    }
}
struct StagedFile {
    path: PathBuf,
    committed: bool,
}
impl Drop for StagedFile {
    fn drop(&mut self) {
        if !self.committed {
            let _ = std::fs::remove_file(&self.path);
        }
    }
}
/// Called in the same transaction as project/run admission so attachments cannot be orphaned or stolen.
pub fn attach_to_project(
    c: &Connection,
    project: &str,
    ids: &[String],
) -> Result<Vec<UploadRecord>, Error> {
    if ids.len() > MAX_ATTACHMENTS {
        return Err(Error::validation(
            "too_many_attachments",
            "A message can include up to eight attachments.",
        ));
    }
    let mut seen = HashSet::new();
    let mut result = Vec::new();
    for id in ids {
        identifier(id)?;
        if !seen.insert(id) {
            return Err(Error::validation(
                "duplicate_attachment",
                "An attachment cannot be attached twice.",
            ));
        }
        let r = record(c, id)?;
        if r.project_id.as_deref().is_some_and(|p| p != project) {
            return Err(Error::not_found());
        }
        if r.status != "ready" {
            return Err(Error::conflict(
                "Wait until every attachment finishes parsing before sending.",
            ));
        }
        c.execute("UPDATE uploads SET project_id=?1 WHERE upload_id=?2 AND (project_id IS NULL OR project_id=?1)",params![project,id])?;
        result.push(record(c, id)?);
        if r.pipeline == "image" {
            let hash: String = c.query_row(
                "SELECT sha256 FROM uploads WHERE upload_id=?1",
                [id],
                |row| row.get(0),
            )?;
            c.execute("INSERT OR IGNORE INTO project_assets(project_id,asset_id,source) VALUES(?1,?2,'upload')",params![project,hash])?;
        }
    }
    Ok(result)
}

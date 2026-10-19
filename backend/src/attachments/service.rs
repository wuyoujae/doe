use super::{Error, Repository, UploadRecord, document};
use crate::db;
use image::{ImageReader, Limits};
use rusqlite::{TransactionBehavior, params};
use std::{
    io::{Cursor, Write},
    sync::Arc,
};

pub(crate) fn decode_image(bytes: &[u8]) -> Result<image::DynamicImage, Error> {
    let mut reader = ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()
        .map_err(|_| Error::validation("invalid_image", "The image format is invalid."))?;
    let mut limits = Limits::default();
    limits.max_image_width = Some(16384);
    limits.max_image_height = Some(16384);
    limits.max_alloc = Some(160_000_000);
    reader.limits(limits);
    let image = reader.decode().map_err(|_| {
        Error::validation(
            "invalid_image",
            "The image is corrupt or exceeds its decoded size limit.",
        )
    })?;
    if u64::from(image.width()) * u64::from(image.height()) > 40_000_000 {
        return Err(Error::validation(
            "image_too_large",
            "The image exceeds the 40 megapixel limit.",
        ));
    }
    Ok(image)
}
impl Repository {
    /// One worker per upload id; durable processing rows are resumed after restart.
    pub fn spawn(self: &Arc<Self>, id: &str) {
        let Ok(mut active) = self.active.lock() else {
            return;
        };
        if !active.insert(id.into()) {
            return;
        }
        drop(active);
        let repository = self.clone();
        let id = id.to_string();
        tokio::spawn(async move {
            if let Err(error) = repository.process(&id).await {
                let failed = repository.clone();
                let failed_id = id.clone();
                let _=tokio::task::spawn_blocking(move||->Result<(),Error>{
                    let c=db::connect(&failed.path)?;
                    c.execute("UPDATE uploads SET status='failed',error_code=?2,error_message=?3,retryable=?4,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE upload_id=?1 AND status='processing'",params![failed_id,error.code,error.message,error.retryable])?;Ok(())
                }).await;
            }
            if let Ok(mut active) = repository.active.lock() {
                active.remove(&id);
            }
        });
    }
    async fn process(self: &Arc<Self>, id: &str) -> Result<(), Error> {
        let repository = self.clone();
        let selected = id.to_string();
        let queued = tokio::task::spawn_blocking(move || repository.get(&selected))
            .await
            .map_err(|_| Error::internal())??;
        if queued.status != "processing" {
            return Ok(());
        }
        let slots = if queued.pipeline == "image" {
            self.image_slots.clone()
        } else {
            self.slots.clone()
        };
        let _permit = slots.acquire_owned().await.map_err(|_| Error::internal())?;
        let repository = self.clone();
        let upload_id = id.to_string();
        let prepared = tokio::task::spawn_blocking(move || -> Result<_, Error> {
            let record = repository.get(&upload_id)?;
            if record.status != "processing" {
                return Ok(None);
            }
            let c = db::connect(&repository.path)?;
            let attempt: u64 = c.query_row(
                "SELECT attempt FROM uploads WHERE upload_id=?1",
                [&upload_id],
                |r| r.get(0),
            )?;
            Ok(Some((
                record.clone(),
                attempt,
                repository.read_managed(&record)?,
            )))
        })
        .await
        .map_err(|_| Error::internal())??;
        let Some((record, attempt, bytes)) = prepared else {
            return Ok(());
        };
        let parsed = if record.pipeline == "document" {
            document::parse(document::ParseDocumentRequest {
                original_name: record.original_name.clone(),
                declared_mime_type: Some(record.mime_type.clone()),
                bytes,
            })
            .await
            .map(|parsed| Processed {
                markdown: parsed.markdown,
                chars: parsed.content_chars,
                tokens: parsed.estimated_tokens,
                warnings: parsed.warnings,
                width: None,
                height: None,
            })
            .map_err(|e| Error {
                code: e.code.as_str().to_ascii_lowercase(),
                message: e.message,
                retryable: e.retryable,
                status: e.code.http_status(),
            })
        } else {
            let repository = self.clone();
            let record = record.clone();
            tokio::task::spawn_blocking(move || repository.process_image(&record, &bytes))
                .await
                .map_err(|_| Error::internal())?
        };
        let repository = self.clone();
        let id = id.to_string();
        tokio::task::spawn_blocking(move || repository.finish(&id, attempt, parsed))
            .await
            .map_err(|_| Error::internal())?
    }
    fn process_image(&self, record: &UploadRecord, bytes: &[u8]) -> Result<Processed, Error> {
        let image = decode_image(bytes)?;
        let mut c = db::connect(&self.path)?;
        let digest: String = c.query_row(
            "SELECT sha256 FROM uploads WHERE upload_id=?1",
            [&record.upload_id],
            |r| r.get(0),
        )?;
        let asset_root = self
            .root
            .parent()
            .ok_or_else(Error::internal)?
            .join("assets");
        std::fs::create_dir_all(&asset_root)?;
        let destination = asset_root.join(&digest);
        if destination.exists() {
            if std::fs::read(&destination)? != bytes {
                return Err(Error::internal());
            }
        } else {
            let temporary = asset_root.join(format!(".pending-{}", uuid::Uuid::new_v4()));
            let result = (|| -> Result<(), Error> {
                let mut f = std::fs::OpenOptions::new()
                    .write(true)
                    .create_new(true)
                    .open(&temporary)?;
                f.write_all(bytes)?;
                f.sync_all()?;
                drop(f);
                std::fs::rename(&temporary, &destination)?;
                Ok(())
            })();
            if let Err(error) = result {
                let _ = std::fs::remove_file(&temporary);
                if std::fs::read(&destination).ok().as_deref() != Some(bytes) {
                    return Err(error);
                }
            }
        }
        let tx = c.transaction_with_behavior(TransactionBehavior::Immediate)?;
        tx.execute("INSERT OR IGNORE INTO assets(sha256,mime,byte_length,width,height) VALUES(?1,?2,?3,?4,?5)",params![digest,record.mime_type,bytes.len(),image.width(),image.height()])?;
        tx.commit()?;
        Ok(Processed {
            markdown: String::new(),
            chars: 0,
            tokens: 0,
            warnings: Vec::new(),
            width: Some(image.width()),
            height: Some(image.height()),
        })
    }
    fn finish(
        &self,
        id: &str,
        attempt: u64,
        result: Result<Processed, Error>,
    ) -> Result<(), Error> {
        let c = db::connect(&self.path)?;
        match result {
            Ok(parsed) => {
                c.execute("UPDATE uploads SET status='ready',parsed_markdown=?3,content_chars=?4,estimated_tokens=?5,warnings_json=?6,width=?7,height=?8,error_code='',error_message='',retryable=0,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE upload_id=?1 AND attempt=?2 AND status='processing'",params![id,attempt,parsed.markdown,parsed.chars,parsed.tokens,serde_json::to_string(&parsed.warnings)?,parsed.width,parsed.height])?;
            }
            Err(error) => {
                c.execute("UPDATE uploads SET status='failed',error_code=?3,error_message=?4,retryable=?5,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE upload_id=?1 AND attempt=?2 AND status='processing'",params![id,attempt,error.code,error.message,error.retryable])?;
            }
        }
        Ok(())
    }
}
struct Processed {
    markdown: String,
    chars: u64,
    tokens: u64,
    warnings: Vec<String>,
    width: Option<u32>,
    height: Option<u32>,
}

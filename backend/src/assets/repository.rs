use super::*;
use crate::{
    db,
    projects::{self, Error},
};
use image::{ImageFormat, ImageReader, Limits};
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use std::{
    fs::{self, OpenOptions},
    io::{Cursor, Write},
    path::{Path, PathBuf},
};

pub struct Repository {
    path: PathBuf,
    root: PathBuf,
}
impl Repository {
    pub(crate) fn prepare_snapshot_asset(&self, bytes: &[u8]) -> Result<PreparedAsset, Error> {
        let (mime, width, height) = validate(bytes)?;
        let id = projects::hash(bytes);
        atomic_write(&self.root, &id, bytes)?;
        Ok(PreparedAsset {
            id,
            mime: mime.into(),
            byte_length: bytes.len(),
            width,
            height,
        })
    }

    pub fn open(data_dir: &Path) -> Result<Self, Error> {
        let root = data_dir.join("assets");
        fs::create_dir_all(&root)?;
        Ok(Self {
            path: data_dir.join("yrkie.sqlite3"),
            root,
        })
    }
    pub fn list(&self, project: &str) -> Result<Vec<ProjectImage>, Error> {
        let connection = db::connect(&self.path)?;
        exists(&connection, project)?;
        let mut statement=connection.prepare("SELECT a.sha256,a.width,a.height,p.source,p.created_at FROM project_assets p JOIN assets a ON a.sha256=p.asset_id WHERE p.project_id=?1 ORDER BY p.created_at DESC,a.sha256")?;
        Ok(statement
            .query_map([project], |row| {
                let id: String = row.get(0)?;
                let width: u32 = row.get(1)?;
                let height: u32 = row.get(2)?;
                Ok(ProjectImage {
                    slide_reference: format!("yrkie-asset-data://{id}"),
                    asset_id: id,
                    width,
                    height,
                    ratio: nearest_ratio(width, height),
                    source: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?)
    }
    pub fn list_jobs(&self, project: &str) -> Result<Vec<ImageJob>, Error> {
        let connection = db::connect(&self.path)?;
        exists(&connection, project)?;
        let mut statement=connection.prepare("SELECT request_id,kind,state,ratio,asset_id,error_code,created_at FROM image_jobs WHERE project_id=?1 ORDER BY created_at DESC LIMIT 500")?;
        Ok(statement
            .query_map([project], job_row)?
            .collect::<Result<Vec<_>, _>>()?)
    }
    pub fn find_by_request(&self, project: &str, request: &str) -> Result<Option<ImageJob>, Error> {
        let connection = db::connect(&self.path)?;
        exists(&connection, project)?;
        find(&connection, project, request)
    }
    pub fn find_succeeded_by_prefix(
        &self,
        project: &str,
        prefix: &str,
    ) -> Result<Option<ImageJob>, Error> {
        projects::request_id(prefix)?;
        let connection = db::connect(&self.path)?;
        exists(&connection, project)?;
        Ok(connection.query_row("SELECT request_id,kind,state,ratio,asset_id,error_code,created_at FROM image_jobs WHERE project_id=?1 AND substr(request_id,1,length(?2))=?2 AND state='succeeded' ORDER BY created_at DESC LIMIT 1",params![project,prefix],job_row).optional()?)
    }
    /// The returned boolean grants one provider attempt; replays never launch another request.
    pub fn reserve_job(
        &self,
        project: &str,
        input: &GenerateInput,
    ) -> Result<(ImageJob, bool), Error> {
        projects::request_id(&input.request_id)?;
        if input.prompt.trim().is_empty()
            || input.prompt.len() > 50_000
            || input.prompt.contains('\0')
        {
            return Err(Error::Invalid(
                "A nonempty image prompt of at most 50000 bytes is required",
            ));
        }
        if !["1:1", "4:3", "3:4", "4:5", "16:9", "9:16"].contains(&input.ratio.as_str()) {
            return Err(Error::Invalid("Unsupported image aspect ratio"));
        }
        let digest = projects::hash(&serde_json::to_vec(input)?);
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        exists(&tx, project)?;
        if let Some(stored) = stored_hash(&tx, project, &input.request_id)? {
            if stored != digest {
                return Err(Error::Idempotency);
            }
            return Ok((
                find(&tx, project, &input.request_id)?.ok_or(Error::NotFound)?,
                false,
            ));
        }
        let active: u32 = tx.query_row(
            "SELECT count(*) FROM image_jobs WHERE state IN ('queued','processing')",
            [],
            |r| r.get(0),
        )?;
        if active >= 8 {
            return Err(Error::Busy);
        }
        tx.execute("INSERT INTO image_jobs(project_id,request_id,request_sha256,kind,state,ratio) VALUES (?1,?2,?3,'generate','processing',?4)",params![project,input.request_id,digest,input.ratio])?;
        let job = find(&tx, project, &input.request_id)?.ok_or(Error::NotFound)?;
        tx.commit()?;
        Ok((job, true))
    }
    pub fn store(
        &self,
        project: &str,
        request: &str,
        bytes: &[u8],
        source: &str,
    ) -> Result<ImageJob, Error> {
        self.store_inner(project, request, bytes, source, None, false)
    }
    pub fn store_for_run(
        &self,
        project: &str,
        request: &str,
        bytes: &[u8],
        source: &str,
        run: &str,
    ) -> Result<ImageJob, Error> {
        self.store_inner(project, request, bytes, source, Some(run), true)
    }
    pub fn store_generated(
        &self,
        project: &str,
        request: &str,
        bytes: &[u8],
    ) -> Result<ImageJob, Error> {
        self.store_inner(project, request, bytes, "generate", None, true)
    }
    fn store_inner(
        &self,
        project: &str,
        request: &str,
        bytes: &[u8],
        source: &str,
        run: Option<&str>,
        reserved: bool,
    ) -> Result<ImageJob, Error> {
        projects::request_id(request)?;
        if !["upload", "generate"].contains(&source) {
            return Err(Error::Invalid("Invalid image source"));
        }
        let (mime, width, height) = validate(bytes)?;
        let digest = projects::hash(bytes);
        let ratio = nearest_ratio(width, height);
        // Validate ownership before touching the filesystem; recheck it in the commit transaction.
        {
            let connection = db::connect(&self.path)?;
            exists(&connection, project)?;
            if let Some(run) = run {
                active_run(&connection, project, run)?;
            }
        }
        atomic_write(&self.root, &digest, bytes)?;
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        exists(&tx, project)?;
        if let Some(run) = run {
            active_run(&tx, project, run)?;
        }
        let existing = find(&tx, project, request)?;
        if let Some(job) = &existing {
            if !reserved && stored_hash(&tx, project, request)?.as_deref() != Some(&digest) {
                return Err(Error::Idempotency);
            }
            if job.state == "succeeded" {
                if job.asset_id.as_deref() != Some(&digest) {
                    return Err(Error::Idempotency);
                }
                return Ok(job.clone());
            }
            if job.kind != source || !matches!(job.state.as_str(), "queued" | "processing") {
                return Err(Error::Conflict);
            }
        } else if reserved {
            return Err(Error::Invalid(
                "Reserve the image job before writing its result",
            ));
        }
        tx.execute("INSERT OR IGNORE INTO assets(sha256,mime,byte_length,width,height) VALUES (?1,?2,?3,?4,?5)",params![digest,mime,bytes.len(),width,height])?;
        tx.execute(
            "INSERT OR IGNORE INTO project_assets(project_id,asset_id,source) VALUES (?1,?2,?3)",
            params![project, digest, source],
        )?;
        if existing.is_some() {
            tx.execute("UPDATE image_jobs SET state='succeeded',ratio=?3,asset_id=?4,error_code='',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE project_id=?1 AND request_id=?2",params![project,request,ratio,digest])?;
        } else {
            tx.execute("INSERT INTO image_jobs(project_id,request_id,request_sha256,kind,state,ratio,asset_id) VALUES (?1,?2,?3,?4,'succeeded',?5,?3)",params![project,request,digest,source,ratio])?;
        }
        let job = find(&tx, project, request)?.ok_or(Error::NotFound)?;
        tx.commit()?;
        Ok(job)
    }
    pub fn fail_job(
        &self,
        project: &str,
        request: &str,
        code: &str,
        uncertain: bool,
    ) -> Result<(), Error> {
        projects::request_id(code)?;
        let connection = db::connect(&self.path)?;
        connection.execute("UPDATE image_jobs SET state=?3,error_code=?4,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE project_id=?1 AND request_id=?2 AND state IN ('queued','processing')",params![project,request,if uncertain {"uncertain"} else {"failed"},code])?;
        Ok(())
    }
    pub fn read(&self, project: &str, id: &str) -> Result<AssetBytes, Error> {
        projects::project_id(project)?;
        if id.len() != 64
            || !id
                .bytes()
                .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
        {
            return Err(Error::NotFound);
        }
        let connection = db::connect(&self.path)?;
        let (mime,length):(String,usize)=connection.query_row("SELECT a.mime,a.byte_length FROM assets a JOIN project_assets p ON p.asset_id=a.sha256 WHERE p.project_id=?1 AND a.sha256=?2",params![project,id],|row|Ok((row.get(0)?,row.get(1)?))).optional()?.ok_or(Error::NotFound)?;
        let path = self.root.join(id);
        let metadata = fs::metadata(&path)?;
        if metadata.len() != length as u64 || length > MAX_IMAGE_BYTES {
            return Err(Error::internal("Managed image content is inconsistent"));
        }
        let bytes = fs::read(path)?;
        if projects::hash(&bytes) != id {
            return Err(Error::internal("Managed image checksum mismatch"));
        }
        Ok(AssetBytes { bytes, mime })
    }
}
fn exists(connection: &Connection, project: &str) -> Result<(), Error> {
    projects::project_id(project)?;
    connection
        .query_row("SELECT 1 FROM projects WHERE id=?1", [project], |_| Ok(()))
        .optional()?
        .ok_or(Error::NotFound)
}
fn active_run(connection: &Connection, project: &str, run: &str) -> Result<(), Error> {
    connection.query_row("SELECT 1 FROM generation_runs r JOIN projects p ON p.id=r.project_id AND p.latest_run_id=r.id WHERE r.id=?1 AND r.project_id=?2 AND r.status IN ('queued','running')",params![run,project],|_|Ok(())).optional()?.ok_or(Error::Inactive)
}
fn stored_hash(
    connection: &Connection,
    project: &str,
    request: &str,
) -> Result<Option<String>, Error> {
    Ok(connection
        .query_row(
            "SELECT request_sha256 FROM image_jobs WHERE project_id=?1 AND request_id=?2",
            params![project, request],
            |row| row.get(0),
        )
        .optional()?)
}
fn find(connection: &Connection, project: &str, request: &str) -> Result<Option<ImageJob>, Error> {
    Ok(connection.query_row("SELECT request_id,kind,state,ratio,asset_id,error_code,created_at FROM image_jobs WHERE project_id=?1 AND request_id=?2",params![project,request],job_row).optional()?)
}
fn job_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<ImageJob> {
    Ok(ImageJob {
        request_id: row.get(0)?,
        kind: row.get(1)?,
        state: row.get(2)?,
        ratio: row.get(3)?,
        asset_id: row.get(4)?,
        error_code: row.get(5)?,
        created_at: row.get(6)?,
    })
}

fn validate(bytes: &[u8]) -> Result<(&'static str, u32, u32), Error> {
    if bytes.is_empty() || bytes.len() > MAX_IMAGE_BYTES {
        return Err(Error::Invalid("Images must be no larger than 20 MiB"));
    }
    let format =
        image::guess_format(bytes).map_err(|_| Error::Invalid("Unsupported image file"))?;
    let mime = match format {
        ImageFormat::Png => "image/png",
        ImageFormat::Jpeg => "image/jpeg",
        ImageFormat::WebP => "image/webp",
        _ => {
            return Err(Error::Invalid(
                "Only PNG, JPEG and WebP images are supported",
            ));
        }
    };
    let (width, height) = ImageReader::with_format(Cursor::new(bytes), format)
        .into_dimensions()
        .map_err(|_| Error::Invalid("Invalid image data"))?;
    if width == 0
        || height == 0
        || width > 16384
        || height > 16384
        || u64::from(width) * u64::from(height) > 40_000_000
    {
        return Err(Error::Invalid(
            "The image dimensions exceed the supported limit",
        ));
    }
    let mut reader = ImageReader::with_format(Cursor::new(bytes), format);
    let mut limits = Limits::default();
    limits.max_image_width = Some(16384);
    limits.max_image_height = Some(16384);
    limits.max_alloc = Some(320_000_000);
    reader.limits(limits);
    reader
        .decode()
        .map_err(|_| Error::Invalid("The image could not be decoded"))?;
    Ok((mime, width, height))
}
fn atomic_write(root: &Path, id: &str, bytes: &[u8]) -> Result<(), Error> {
    let destination = root.join(id);
    if destination.exists() {
        let metadata = fs::metadata(&destination)?;
        if metadata.len() != bytes.len() as u64 || projects::hash(&fs::read(&destination)?) != id {
            return Err(Error::internal(
                "An existing asset failed checksum verification",
            ));
        }
        return Ok(());
    }
    let temporary = root.join(format!(".pending-{}", uuid::Uuid::new_v4()));
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temporary)?;
    let result = (|| {
        file.write_all(bytes)?;
        file.sync_all()?;
        drop(file);
        match fs::rename(&temporary, &destination) {
            Ok(()) => Ok(()),
            Err(error) if destination.exists() => {
                if projects::hash(&fs::read(&destination)?) == id {
                    Ok(())
                } else {
                    Err(error)
                }
            }
            Err(error) => Err(error),
        }
    })();
    if temporary.exists() {
        let _ = fs::remove_file(&temporary);
    }
    result.map_err(Error::from)
}

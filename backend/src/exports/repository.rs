use super::*;
use crate::db;
use rusqlite::{OptionalExtension, TransactionBehavior, params};
use serde_json::Value;
use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
};

pub struct Repository {
    pub(crate) path: PathBuf,
    root: PathBuf,
}
pub(crate) struct Claimed {
    pub job: Job,
    pub deck: Value,
    pub embed_fonts: bool,
}

impl Repository {
    pub fn open(data: &Path) -> Result<Self, Error> {
        let root = data.join("exports");
        fs::create_dir_all(&root)?;
        Ok(Self {
            path: data.join("yrkie.sqlite3"),
            root,
        })
    }
    pub fn create(
        &self,
        project: &str,
        format: Format,
        input: &CreateExport,
    ) -> Result<Job, Error> {
        crate::projects::project_id(project).map_err(|_| Error::NotFound)?;
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let (revision, source): (u64, Option<String>) = tx
            .query_row(
                "SELECT deck_revision,deck_json FROM projects WHERE id=?1",
                [project],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .optional()?
            .ok_or(Error::NotFound)?;
        if revision != input.expected_source_revision {
            return Err(Error::Conflict);
        }
        let source = source.ok_or(Error::Invalid(
            "Save a nonempty presentation before exporting",
        ))?;
        let deck: Value = serde_json::from_str(&source)?;
        let slides = deck
            .pointer("/deck/slides")
            .and_then(Value::as_array)
            .ok_or(Error::Invalid("The presentation has no slides"))?;
        if slides.is_empty() || slides.len() > 300 || source.len() > crate::projects::MAX_DECK_BYTES
        {
            return Err(Error::Invalid("The presentation exceeds the export limits"));
        }
        let fonts = format == Format::Pdf || input.embed_fonts;
        let (compiler, writer) = if format == Format::Pdf {
            (PDF, PDF)
        } else {
            (COMPILER, WRITER)
        };
        let source_hash = digest(source.as_bytes());
        let key = digest(
            format!(
                "{source_hash}\n{}\n{RENDERER}\n{compiler}\n{writer}\n{fonts}",
                format.extension()
            )
            .as_bytes(),
        );
        if let Some(id) = tx.query_row("SELECT id FROM presentation_exports WHERE project_id=?1 AND dedupe_key=?2 AND status IN ('queued','running','completed')",params![project,key],|r|r.get::<_,String>(0)).optional()? {
            let job = read_job(&tx, &id)?; tx.commit()?; return Ok(job);
        }
        let active: u64 = tx.query_row(
            "SELECT count(*) FROM presentation_exports WHERE status IN ('queued','running')",
            [],
            |r| r.get(0),
        )?;
        if active >= 16 {
            return Err(Error::Invalid(
                "The export queue is full; wait for an active export",
            ));
        }
        let id = format!("export-{}", uuid::Uuid::new_v4());
        let name = format!(
            "yrkie-{}.{}",
            if format == Format::Pdf { "pdf" } else { "ppt" },
            format.extension()
        );
        tx.execute("INSERT INTO presentation_exports(id,project_id,format,status,source_revision,source_sha256,snapshot_json,dedupe_key,embed_fonts,file_name,renderer_contract,compiler_contract,writer_contract) VALUES (?1,?2,?3,'queued',?4,?5,?6,?7,?8,?9,?10,?11,?12)",params![id,project,format.extension(),revision,source_hash,source,key,fonts,name,RENDERER,compiler,writer])?;
        let job = read_job(&tx, &id)?;
        tx.commit()?;
        Ok(job)
    }
    pub fn read(&self, id: &str) -> Result<Job, Error> {
        identity(id)?;
        read_job(&db::connect(&self.path)?, id)
    }
    pub fn cancel(&self, id: &str) -> Result<Job, Error> {
        identity(id)?;
        let connection = db::connect(&self.path)?;
        connection.execute("UPDATE presentation_exports SET status='cancelled',owner_id=NULL,lease_expires_at=NULL,error_code='export_cancelled',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1 AND status IN ('queued','running')",[id])?;
        read_job(&connection, id)
    }
    pub fn download(&self, id: &str) -> Result<(Job, Vec<u8>), Error> {
        let job = self.read(id)?;
        if job.status != "completed" {
            return Err(Error::Conflict);
        }
        let connection = db::connect(&self.path)?;
        let (hash, length): (String, u64) = connection.query_row(
            "SELECT output_sha256,output_size_bytes FROM presentation_exports WHERE id=?1",
            [id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )?;
        let path = self.output_path(id, job.format)?;
        let result = (|| -> Result<Vec<u8>, Error> {
            let metadata = fs::metadata(&path)?;
            if metadata.len() != length || length > MAX_OUTPUT as u64 {
                return Err(Error::Runtime("export_artifact_invalid"));
            }
            let bytes = fs::read(path)?;
            if digest(&bytes) != hash || !job.format.valid(&bytes) {
                return Err(Error::Runtime("export_artifact_invalid"));
            }
            Ok(bytes)
        })();
        match result {
            Ok(bytes) => Ok((job, bytes)),
            Err(_) => {
                connection.execute("UPDATE presentation_exports SET status='failed',error_code='export_artifact_unavailable',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1 AND status='completed'",[id])?;
                Err(Error::Runtime("export_artifact_unavailable"))
            }
        }
    }
    pub(crate) fn claim(&self, owner: &str) -> Result<Option<Claimed>, Error> {
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let id=tx.query_row("SELECT id FROM presentation_exports WHERE status='queued' OR (status='running' AND lease_expires_at < unixepoch()) ORDER BY created_at,id LIMIT 1",[],|r|r.get::<_,String>(0)).optional()?;
        let Some(id) = id else {
            tx.commit()?;
            return Ok(None);
        };
        tx.execute("UPDATE presentation_exports SET status='running',owner_id=?2,lease_expires_at=unixepoch()+60,error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![id,owner])?;
        let (source, hash, fonts): (String, String, bool) = tx.query_row(
            "SELECT snapshot_json,source_sha256,embed_fonts FROM presentation_exports WHERE id=?1",
            [&id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )?;
        let (renderer,compiler,writer,format):(String,String,String,String)=tx.query_row("SELECT renderer_contract,compiler_contract,writer_contract,format FROM presentation_exports WHERE id=?1",[&id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?)))?;
        let contracts = if format == "pdf" {
            (PDF, PDF)
        } else {
            (COMPILER, WRITER)
        };
        if renderer != RENDERER || compiler != contracts.0 || writer != contracts.1 {
            tx.execute("UPDATE presentation_exports SET status='failed',error_code='export_contract_changed',owner_id=NULL,lease_expires_at=NULL WHERE id=?1",[&id])?;
            tx.commit()?;
            return Err(Error::Runtime("export_contract_changed"));
        }
        if digest(source.as_bytes()) != hash {
            tx.execute("UPDATE presentation_exports SET status='failed',error_code='export_snapshot_invalid',owner_id=NULL,lease_expires_at=NULL WHERE id=?1",[&id])?;
            tx.commit()?;
            return Err(Error::Runtime("export_snapshot_invalid"));
        }
        let result = Claimed {
            job: read_job(&tx, &id)?,
            deck: serde_json::from_str(&source)?,
            embed_fonts: fonts,
        };
        tx.commit()?;
        Ok(Some(result))
    }
    pub(crate) fn renew(&self, id: &str, owner: &str) -> Result<bool, Error> {
        Ok(db::connect(&self.path)?.execute("UPDATE presentation_exports SET lease_expires_at=unixepoch()+60 WHERE id=?1 AND owner_id=?2 AND status='running' AND lease_expires_at>=unixepoch()",params![id,owner])?==1)
    }
    pub(crate) fn fail(&self, id: &str, owner: &str, code: &str) -> Result<(), Error> {
        db::connect(&self.path)?.execute("UPDATE presentation_exports SET status='failed',error_code=?3,owner_id=NULL,lease_expires_at=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1 AND owner_id=?2 AND status='running'",params![id,owner,code])?;
        Ok(())
    }
    pub(crate) fn complete(&self, job: &Job, owner: &str, bytes: &[u8]) -> Result<(), Error> {
        if !job.format.valid(bytes) {
            return Err(Error::Runtime("export_invalid_file"));
        }
        let path = self.output_path(&job.job_id, job.format)?;
        fs::create_dir_all(path.parent().ok_or(Error::NotFound)?)?;
        let temporary = path.with_extension(format!("{}.part", uuid::Uuid::new_v4()));
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temporary)?;
        file.write_all(bytes)?;
        file.sync_all()?;
        drop(file);
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let owns=tx.query_row("SELECT 1 FROM presentation_exports WHERE id=?1 AND owner_id=?2 AND status='running' AND lease_expires_at>=unixepoch()",params![job.job_id,owner],|_|Ok(())).optional()?.is_some();
        if !owns {
            let _ = fs::remove_file(&temporary);
            return Err(Error::Conflict);
        }
        // A former worker can never publish after losing its lease. The final path is deterministic.
        if path.exists() {
            fs::remove_file(&path)?;
        }
        fs::rename(&temporary, &path)?;
        tx.execute("UPDATE presentation_exports SET status='completed',output_sha256=?3,output_size_bytes=?4,owner_id=NULL,lease_expires_at=NULL,error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1 AND owner_id=?2 AND status='running'",params![job.job_id,owner,digest(bytes),bytes.len() as u64])?;
        tx.commit()?;
        Ok(())
    }
    fn output_path(&self, id: &str, format: Format) -> Result<PathBuf, Error> {
        identity(id)?;
        Ok(self
            .root
            .join(id)
            .join(format!("document.{}", format.extension())))
    }
}

fn read_job(connection: &rusqlite::Connection, id: &str) -> Result<Job, Error> {
    connection.query_row("SELECT id,project_id,format,status,source_revision,file_name,error_code,output_size_bytes,created_at,updated_at FROM presentation_exports WHERE id=?1",[id],|r|{
        let id:String=r.get(0)?;let status:String=r.get(3)?;let format:String=r.get(2)?;
        Ok(Job{download_url:(status=="completed").then(||format!("/api/v1/exports/{id}/download")),job_id:id,project_id:r.get(1)?,format:if format=="pdf"{Format::Pdf}else{Format::Pptx},status,source_revision:r.get(4)?,file_name:r.get(5)?,error_code:r.get(6)?,output_size_bytes:r.get(7)?,created_at:r.get(8)?,updated_at:r.get(9)?})
    }).optional()?.ok_or(Error::NotFound)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    fn setup() -> (PathBuf, Repository, String) {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../test/20261019-original-core/export-store")
            .join(uuid::Uuid::new_v4().to_string());
        crate::models::Repository::open(&root).expect("database migrations");
        let repository = Repository::open(&root).unwrap();
        let connection = db::connect(&repository.path).unwrap();
        let id = format!("srv-{}", uuid::Uuid::new_v4());
        let deck=json!({"version":4,"deck":{"title":"Export fixture","slides":[{"id":"slide-1","size":{"width":960,"height":540,"unit":"pt"},"blocks":[]}]}}).to_string();
        connection.execute("INSERT INTO projects(id,title,prompt,status,deck_revision,deck_json) VALUES(?1,'Export fixture','Export the saved document','ready',1,?2)",params![id,deck]).unwrap();
        (root, repository, id)
    }
    fn input() -> CreateExport {
        CreateExport {
            expected_source_revision: 1,
            embed_fonts: true,
        }
    }
    #[test]
    fn frozen_snapshot_revision_and_format_contracts_are_independent() {
        let (_, repository, id) = setup();
        assert!(matches!(
            repository.create(
                &id,
                Format::Pdf,
                &CreateExport {
                    expected_source_revision: 2,
                    embed_fonts: true
                }
            ),
            Err(Error::Conflict)
        ));
        let pdf = repository.create(&id, Format::Pdf, &input()).unwrap();
        assert_eq!(
            pdf.job_id,
            repository
                .create(&id, Format::Pdf, &input())
                .unwrap()
                .job_id
        );
        let pptx = repository.create(&id, Format::Pptx, &input()).unwrap();
        assert_ne!(pptx.job_id, pdf.job_id);
        let plain = repository
            .create(
                &id,
                Format::Pptx,
                &CreateExport {
                    expected_source_revision: 1,
                    embed_fonts: false,
                },
            )
            .unwrap();
        assert_ne!(plain.job_id, pptx.job_id);
        db::connect(&repository.path).unwrap().execute("UPDATE projects SET deck_revision=2,deck_json=json_set(deck_json,'$.deck.title','Updated source') WHERE id=?1",[&id]).unwrap();
        let claim = repository.claim("worker-a").unwrap().unwrap();
        assert_eq!(claim.deck.pointer("/deck/title").unwrap(), "Export fixture");
        assert_eq!(claim.job.source_revision, 1);
    }
    #[test]
    fn expired_lease_and_cancel_fence_late_publication() {
        let (_, repository, id) = setup();
        let job = repository.create(&id, Format::Pdf, &input()).unwrap();
        repository.claim("old-worker").unwrap().unwrap();
        assert!(repository.claim("other-worker").unwrap().is_none());
        db::connect(&repository.path)
            .unwrap()
            .execute(
                "UPDATE presentation_exports SET lease_expires_at=unixepoch()-1 WHERE id=?1",
                [&job.job_id],
            )
            .unwrap();
        repository.claim("new-worker").unwrap().unwrap();
        assert!(!repository.renew(&job.job_id, "old-worker").unwrap());
        assert!(matches!(
            repository.complete(&job, "old-worker", b"%PDF-1.7\n%%EOF"),
            Err(Error::Conflict)
        ));
        repository.cancel(&job.job_id).unwrap();
        assert!(matches!(
            repository.complete(&job, "new-worker", b"%PDF-1.7\n%%EOF"),
            Err(Error::Conflict)
        ));
        assert_eq!(repository.read(&job.job_id).unwrap().status, "cancelled");
        assert_ne!(
            repository
                .create(&id, Format::Pdf, &input())
                .unwrap()
                .job_id,
            job.job_id
        );
    }
    #[test]
    fn completed_artifact_integrity_and_missing_file_allow_retry() {
        let (_, repository, id) = setup();
        let job = repository.create(&id, Format::Pdf, &input()).unwrap();
        repository.claim("worker").unwrap().unwrap();
        assert!(matches!(
            repository.complete(&job, "worker", b"invalid"),
            Err(Error::Runtime(_))
        ));
        let bytes = b"%PDF-1.7\nfixture\n%%EOF";
        repository.complete(&job, "worker", bytes).unwrap();
        assert_eq!(repository.download(&job.job_id).unwrap().1, bytes);
        fs::write(
            repository.output_path(&job.job_id, Format::Pdf).unwrap(),
            b"tampered",
        )
        .unwrap();
        assert!(matches!(
            repository.download(&job.job_id),
            Err(Error::Runtime("export_artifact_unavailable"))
        ));
        assert_eq!(repository.read(&job.job_id).unwrap().status, "failed");
        assert_ne!(
            repository
                .create(&id, Format::Pdf, &input())
                .unwrap()
                .job_id,
            job.job_id
        );
        assert!(matches!(
            repository.read("export-../../private"),
            Err(Error::NotFound)
        ));
    }
    #[test]
    fn changed_contract_and_corrupt_snapshot_fail_before_engine_execution() {
        let (_, repository, id) = setup();
        let job = repository.create(&id, Format::Pdf, &input()).unwrap();
        let connection = db::connect(&repository.path).unwrap();
        connection
            .execute(
                "UPDATE presentation_exports SET writer_contract='previous-engine' WHERE id=?1",
                [&job.job_id],
            )
            .unwrap();
        assert!(matches!(
            repository.claim("worker"),
            Err(Error::Runtime("export_contract_changed"))
        ));
        assert_eq!(repository.read(&job.job_id).unwrap().status, "failed");
        let job = repository.create(&id, Format::Pdf, &input()).unwrap();
        connection
            .execute(
                "UPDATE presentation_exports SET source_sha256=?2 WHERE id=?1",
                params![job.job_id, "0".repeat(64)],
            )
            .unwrap();
        assert!(matches!(
            repository.claim("worker"),
            Err(Error::Runtime("export_snapshot_invalid"))
        ));
        assert_eq!(repository.read(&job.job_id).unwrap().status, "failed");
    }
}

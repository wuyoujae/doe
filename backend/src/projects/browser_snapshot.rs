//! Frozen browser drafts use the same server-side export/playback engines.
use super::{Error, MAX_DECK_BYTES, Repository, validation};
use crate::{assets, db};
use base64::Engine;
use rusqlite::{OptionalExtension, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashSet;

const MAX_ASSET_TOTAL: usize = 64 * 1024 * 1024;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BrowserSnapshotInput {
    pub source_id: String,
    pub source_revision: u64,
    pub prompt: String,
    pub deck: Value,
    pub assets: Vec<BrowserAsset>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BrowserAsset {
    pub asset_id: String,
    pub base64: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserSnapshot {
    pub project_id: String,
    pub revision: u64,
}

impl Repository {
    pub fn browser_snapshot(
        &self,
        request: BrowserSnapshotInput,
        assets: &assets::Repository,
    ) -> Result<BrowserSnapshot, Error> {
        if uuid::Uuid::parse_str(&request.source_id).is_err()
            || request.source_revision == 0
            || request.source_revision > 9_007_199_254_740_991
            || request.assets.len() > 200
        {
            return Err(Error::Invalid(
                "Invalid browser document identity or asset count",
            ));
        }
        validation::text(&request.prompt, 50_000)?;
        let deck_bytes = serde_json::to_vec(&request.deck)?;
        if deck_bytes.len() > MAX_DECK_BYTES {
            return Err(Error::Invalid("The deck exceeds 8 MiB"));
        }
        let key = format!("{}:{}", request.source_id, request.source_revision);
        let digest = validation::hash(&deck_bytes);
        let mut connection = db::connect(&self.path)?;
        let replay: Option<(String, String)> = connection.query_row(
            "SELECT project_id,request_sha256 FROM project_requests WHERE scope='browser_snapshot' AND request_id=?1",
            [&key], |row| Ok((row.get(0)?, row.get(1)?)),
        ).optional()?;
        if let Some((project_id, previous)) = replay {
            if previous != digest {
                return Err(Error::Idempotency);
            }
            return Ok(BrowserSnapshot {
                project_id,
                revision: 1,
            });
        }
        let mut prepared = Vec::new();
        let mut seen = HashSet::new();
        let mut total = 0usize;
        for asset in request.assets {
            if !seen.insert(asset.asset_id.clone())
                || asset.base64.len() > assets::MAX_IMAGE_BYTES.div_ceil(3) * 4
            {
                return Err(Error::Invalid("Invalid browser document image"));
            }
            let bytes = base64::engine::general_purpose::STANDARD
                .decode(asset.base64)
                .map_err(|_| Error::Invalid("Invalid browser document image"))?;
            total = total
                .checked_add(bytes.len())
                .ok_or(Error::Invalid("Browser document images exceed 64 MiB"))?;
            if total > MAX_ASSET_TOTAL || validation::hash(&bytes) != asset.asset_id {
                return Err(Error::Invalid(
                    "Browser document images exceed 64 MiB or failed checksum verification",
                ));
            }
            prepared.push(assets.prepare_snapshot_asset(&bytes)?);
        }
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        if let Some((project_id, previous)) = tx.query_row(
            "SELECT project_id,request_sha256 FROM project_requests WHERE scope='browser_snapshot' AND request_id=?1",
            [&key], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        ).optional()? {
            if previous != digest { return Err(Error::Idempotency); }
            return Ok(BrowserSnapshot { project_id, revision: 1 });
        }
        let project_id = format!("srv-{}", uuid::Uuid::new_v4());
        let title = super::repository::deck_title(&request.deck, "Presentation");
        tx.execute("INSERT INTO projects(id,title,prompt,status,deck_json,deck_revision) VALUES (?1,?2,?3,'ready',?4,1)",
            params![project_id, title, request.prompt.trim(), String::from_utf8(deck_bytes).map_err(Error::internal)?])?;
        for asset in prepared {
            tx.execute("INSERT OR IGNORE INTO assets(sha256,mime,byte_length,width,height) VALUES (?1,?2,?3,?4,?5)",
                params![asset.id, asset.mime, asset.byte_length, asset.width, asset.height])?;
            tx.execute(
                "INSERT INTO project_assets(project_id,asset_id,source) VALUES (?1,?2,'upload')",
                params![project_id, asset.id],
            )?;
        }
        validation::deck(&tx, &project_id, &request.deck)?;
        tx.execute("INSERT INTO project_requests(scope,request_id,request_sha256,project_id) VALUES ('browser_snapshot',?1,?2,?3)", params![key, digest, project_id])?;
        tx.commit()?;
        Ok(BrowserSnapshot {
            project_id,
            revision: 1,
        })
    }
}

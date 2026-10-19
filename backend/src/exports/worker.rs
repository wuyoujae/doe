use super::{repository::Claimed, *};
use base64::{Engine, engine::general_purpose::STANDARD};
use serde_json::{Value, json};
use std::{
    collections::BTreeSet,
    path::{Path, PathBuf},
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::Duration,
};

pub struct Service {
    pub repository: Arc<Repository>,
    assets: Arc<crate::assets::Repository>,
    token_path: PathBuf,
    client: reqwest::Client,
    owner: String,
    started: AtomicBool,
}
impl Service {
    pub fn open(data: &Path, assets: Arc<crate::assets::Repository>) -> Result<Arc<Self>, Error> {
        Ok(Arc::new(Self {
            repository: Arc::new(Repository::open(data)?),
            assets,
            token_path: data.join("export-token"),
            client: reqwest::Client::builder()
                .no_proxy()
                .connect_timeout(Duration::from_secs(5))
                .timeout(Duration::from_secs(20 * 60))
                .build()
                .map_err(Error::storage)?,
            owner: uuid::Uuid::new_v4().to_string(),
            started: AtomicBool::new(false),
        }))
    }
    /// One start per process. Expired leases are reclaimed without changing the frozen input.
    pub fn start(self: &Arc<Self>) {
        if self.started.swap(true, Ordering::AcqRel) {
            return;
        }
        for worker in 0..2 {
            let service = self.clone();
            tokio::spawn(async move {
                let owner = format!("{}:{worker}", service.owner);
                loop {
                    let repository = service.repository.clone();
                    let claim_owner = owner.clone();
                    match tokio::task::spawn_blocking(move || repository.claim(&claim_owner)).await
                    {
                        Ok(Ok(Some(claimed))) => service.execute(claimed, &owner).await,
                        Ok(Ok(None)) => tokio::time::sleep(Duration::from_millis(750)).await,
                        _ => {
                            eprintln!("Export queue storage unavailable");
                            tokio::time::sleep(Duration::from_secs(3)).await;
                        }
                    }
                }
            });
        }
    }
    async fn execute(&self, claimed: Claimed, owner: &str) {
        let job = claimed.job.clone();
        let future = self.generate(claimed);
        tokio::pin!(future);
        let mut heartbeat = tokio::time::interval(Duration::from_secs(10));
        heartbeat.tick().await;
        let result = loop {
            tokio::select! {
                result=&mut future=>break result,
                _=heartbeat.tick()=>{
                    let repository=self.repository.clone();let id=job.job_id.clone();let current_owner=owner.to_string();
                    if !matches!(tokio::task::spawn_blocking(move||repository.renew(&id,&current_owner)).await,Ok(Ok(true))) {return;}
                }
            }
        };
        let repository = self.repository.clone();
        let owner = owner.to_string();
        let _ = tokio::task::spawn_blocking(move || {
            match result {
                Ok(bytes) => {
                    if let Err(error) = repository.complete(&job, &owner, &bytes) {
                        if !matches!(error, Error::Conflict) {
                            repository.fail(&job.job_id, &owner, "export_storage_unavailable")?;
                        }
                    }
                }
                Err(error) => {
                    let code = match error {
                        Error::Runtime(code) => code,
                        _ => "export_generation_failed",
                    };
                    repository.fail(&job.job_id, &owner, code)?;
                }
            }
            Ok::<_, Error>(())
        })
        .await;
    }
    async fn generate(&self, claimed: Claimed) -> Result<Vec<u8>, Error> {
        let assets = self.assets.clone();
        let format = claimed.job.format;
        let payload=tokio::task::spawn_blocking(move||{
            let mut ids=BTreeSet::new();collect_assets(&claimed.deck,&mut ids)?;
            let mut payloads=serde_json::Map::new();let mut total=0usize;
            for id in ids {
                let asset=assets.read(&claimed.job.project_id,&id).map_err(|_|Error::Runtime("doe_export_assets_unavailable"))?;
                total=total.checked_add(asset.bytes.len()).ok_or(Error::Runtime("presentation_too_large"))?;
                if total>96*1024*1024{return Err(Error::Runtime("presentation_too_large"));}
                payloads.insert(id,json!({"content_type":asset.mime,"base64":STANDARD.encode(asset.bytes)}));
            }
            // Same wire payload as the original Web -> HTMLIR boundary. No remote asset credentials.
            serde_json::to_vec(&json!({"deck":claimed.deck,"assets":payloads,"watermark":false,"embed_fonts":claimed.embed_fonts,"output_mode":if format==Format::Pdf{"pdf"}else{"editable"}})).map_err(Error::from)
        }).await.map_err(|_|Error::Runtime("export_preparation_failed"))??;
        if payload.len() > 150 * 1024 * 1024 {
            return Err(Error::Runtime("presentation_too_large"));
        }
        let token = std::fs::read_to_string(&self.token_path)
            .map_err(|_| Error::Runtime("export_runtime_unavailable"))?;
        let token = token.trim();
        if token.len() != 64 || !token.bytes().all(|b| b.is_ascii_hexdigit()) {
            return Err(Error::Runtime("export_runtime_unavailable"));
        }
        let request = self
            .client
            .post(format!(
                "http://127.0.0.1:7766/api/schema-v4/export-{}",
                format.extension()
            ))
            .bearer_auth(token)
            .header(reqwest::header::CONTENT_TYPE, "application/json")
            .body(payload)
            .build()
            .map_err(|_| Error::Runtime("export_runtime_unavailable"))?;
        let deadline = tokio::time::Instant::now() + Duration::from_secs(20 * 60);
        let mut response = loop {
            let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
            if remaining.is_zero() {
                return Err(Error::Runtime("export_runtime_unavailable"));
            }
            let mut attempt = request
                .try_clone()
                .ok_or(Error::Runtime("export_preparation_failed"))?;
            *attempt.timeout_mut() = Some(remaining);
            let response = self
                .client
                .execute(attempt)
                .await
                .map_err(|_| Error::Runtime("export_runtime_unavailable"))?;
            // A cancelled HTTP caller can leave its original renderer finishing a page.
            // Preserve the queued job instead of failing the next job while that slot drains.
            if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                drop(response);
                tokio::time::sleep(Duration::from_secs(1)).await;
                continue;
            }
            break response;
        };
        let success = response.status().is_success();
        let limit = if success { MAX_OUTPUT } else { 16 * 1024 };
        if response
            .content_length()
            .is_some_and(|length| length > limit as u64)
        {
            return Err(Error::Runtime("export_invalid_file"));
        }
        let mut bytes = Vec::new();
        while let Some(chunk) = response
            .chunk()
            .await
            .map_err(|_| Error::Runtime("export_runtime_unavailable"))?
        {
            if bytes.len().saturating_add(chunk.len()) > limit {
                return Err(Error::Runtime("export_invalid_file"));
            }
            bytes.extend_from_slice(&chunk);
        }
        if !success {
            let code = serde_json::from_slice::<Value>(&bytes)
                .ok()
                .and_then(|v| v.get("code").and_then(Value::as_str).map(str::to_string));
            return Err(Error::Runtime(
                if code.as_deref() == Some("doe_export_layout_overflow") {
                    "doe_export_layout_overflow"
                } else {
                    "export_generation_failed"
                },
            ));
        }
        if !format.valid(&bytes) {
            return Err(Error::Runtime("export_invalid_file"));
        }
        Ok(bytes)
    }
}

fn collect_assets(value: &Value, ids: &mut BTreeSet<String>) -> Result<(), Error> {
    match value {
        Value::String(value) => {
            if let Some(id) = value
                .strip_prefix("yrkie-asset-data://")
                .or_else(|| value.strip_prefix("yrkie-asset-base64://"))
            {
                if id.len() != 64
                    || !id
                        .bytes()
                        .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
                {
                    return Err(Error::Runtime("doe_export_assets_unavailable"));
                }
                ids.insert(id.to_string());
            }
        }
        Value::Array(values) => {
            for value in values {
                collect_assets(value, ids)?;
            }
        }
        Value::Object(values) => {
            for value in values.values() {
                collect_assets(value, ids)?;
            }
        }
        _ => {}
    }
    Ok(())
}

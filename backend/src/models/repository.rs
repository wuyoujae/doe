use super::{
    EndpointInput, EndpointView, SaveSettings, SettingsSnapshot, SettingsView, ValidationError,
};
use crate::{db, security::SecretStore};
use rusqlite::{Connection, TransactionBehavior, params};
use std::path::{Path, PathBuf};
use zeroize::Zeroizing;

type InternalError = Box<dyn std::error::Error + Send + Sync>;

#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error(transparent)]
    Validation(#[from] ValidationError),
    #[error("The model settings changed; reload before saving")]
    Conflict,
    #[error("Model settings storage is unavailable")]
    Storage(#[source] InternalError),
}

impl StorageError {
    pub fn internal(error: impl Into<InternalError>) -> Self {
        Self::Storage(error.into())
    }
}
impl From<rusqlite::Error> for StorageError {
    fn from(error: rusqlite::Error) -> Self {
        Self::internal(error)
    }
}
impl From<serde_json::Error> for StorageError {
    fn from(error: serde_json::Error) -> Self {
        Self::internal(error)
    }
}

pub struct Repository {
    path: PathBuf,
    secrets: SecretStore,
}

/// Credentials stay inside the backend and intentionally have no Debug/Serialize implementation.
pub struct ResolvedModel {
    pub endpoint: EndpointView,
    pub api_key: Zeroizing<String>,
}

impl Repository {
    pub fn open(data_dir: &Path) -> Result<Self, StorageError> {
        let path = data_dir.join("yrkie.sqlite3");
        let secrets = SecretStore::open(data_dir, path.exists()).map_err(StorageError::internal)?;
        let mut connection = db::connect(&path)?;
        db::migrate(&mut connection).map_err(StorageError::internal)?;
        let repository = Self { path, secrets };
        for kind in ["text", "image"] {
            repository.resolve(kind)?;
        }
        Ok(repository)
    }

    pub fn read(&self) -> Result<SettingsSnapshot, StorageError> {
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction()?;
        let snapshot = snapshot(&tx)?;
        tx.commit()?;
        Ok(snapshot)
    }

    pub fn save(&self, request: SaveSettings) -> Result<SettingsSnapshot, StorageError> {
        let request = request.validate()?;
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let current: u64 = tx.query_row(
            "SELECT revision FROM model_settings_state WHERE id = 1",
            [],
            |row| row.get(0),
        )?;
        if current != request.revision {
            return Err(StorageError::Conflict);
        }
        for (kind, input) in [
            ("text", request.settings.text),
            ("image", request.settings.image),
        ] {
            let (old, ciphertext) = read_endpoint(&tx, kind)?;
            let next_key = match input.api_key.as_deref() {
                Some("") => None,
                Some(value) => Some(
                    self.secrets
                        .encrypt(kind, value)
                        .map_err(StorageError::internal)?,
                ),
                None if input.provider == old.provider && input.base_url == old.base_url => {
                    ciphertext
                }
                None => None,
            };
            // Clearing an endpoint also clears its credential, even if the key field was omitted.
            let next_key = if input.base_url.is_empty() {
                None
            } else {
                next_key
            };
            tx.execute(
                "UPDATE model_configs SET provider=?1, base_url=?2, model_id=?3, options_json=?4, key_ciphertext=?5,
                    updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE kind=?6",
                params![input.provider, input.base_url, input.model, serde_json::to_string(&input.options)?, next_key, kind],
            )?;
        }
        tx.execute("UPDATE model_settings_state SET revision=revision+1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1", [])?;
        let result = snapshot(&tx)?;
        tx.commit()?;
        Ok(result)
    }

    pub fn resolve(&self, kind: &str) -> Result<ResolvedModel, StorageError> {
        if !matches!(kind, "text" | "image") {
            return Err(StorageError::internal("Unknown model kind"));
        }
        let connection = db::connect(&self.path)?;
        self.resolve_in(&connection, kind)
    }

    /// Freeze both endpoints and credentials from one SQLite snapshot. Credentials never serialize.
    pub fn resolve_pair(&self) -> Result<(u64, ResolvedModel, ResolvedModel), StorageError> {
        let mut connection = db::connect(&self.path)?;
        let transaction = connection.transaction()?;
        let revision = transaction.query_row(
            "SELECT revision FROM model_settings_state WHERE id=1",
            [],
            |row| row.get(0),
        )?;
        let text = self.resolve_in(&transaction, "text")?;
        let image = self.resolve_in(&transaction, "image")?;
        transaction.commit()?;
        Ok((revision, text, image))
    }

    fn resolve_in(
        &self,
        connection: &Connection,
        kind: &str,
    ) -> Result<ResolvedModel, StorageError> {
        let (endpoint, ciphertext) = read_endpoint(connection, kind)?;
        let mut validation_input = EndpointInput {
            provider: endpoint.provider.clone(),
            base_url: endpoint.base_url.clone(),
            model: endpoint.model.clone(),
            api_key: None,
            options: endpoint.options.clone(),
        };
        super::validation::endpoint(kind, &mut validation_input).map_err(|_| {
            StorageError::internal("Persisted model configuration failed validation")
        })?;
        let api_key = ciphertext
            .map(|ciphertext| self.secrets.decrypt(kind, &ciphertext))
            .transpose()
            .map_err(StorageError::internal)?
            .unwrap_or_else(|| Zeroizing::new(String::new()));
        Ok(ResolvedModel { endpoint, api_key })
    }
}

fn snapshot(connection: &Connection) -> Result<SettingsSnapshot, StorageError> {
    let revision = connection.query_row(
        "SELECT revision FROM model_settings_state WHERE id=1",
        [],
        |row| row.get(0),
    )?;
    let (text, _) = read_endpoint(connection, "text")?;
    let (image, _) = read_endpoint(connection, "image")?;
    Ok(SettingsSnapshot {
        revision,
        settings: SettingsView { text, image },
    })
}

fn read_endpoint(
    connection: &Connection,
    kind: &str,
) -> Result<(EndpointView, Option<Vec<u8>>), StorageError> {
    let (provider, base_url, model, json, key): (String, String, String, String, Option<Vec<u8>>) = connection.query_row(
        "SELECT provider,base_url,model_id,options_json,key_ciphertext FROM model_configs WHERE kind=?1", [kind],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
    )?;
    let endpoint = EndpointView {
        provider,
        base_url,
        model,
        has_api_key: key.is_some(),
        options: serde_json::from_str(&json)?,
    };
    Ok((endpoint, key))
}

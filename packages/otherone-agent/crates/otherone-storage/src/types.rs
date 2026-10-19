use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, sync::Arc, future::Future, pin::Pin};

pub type StoreFuture<T> = Pin<Box<dyn Future<Output=Result<T, String>> + Send>>;

/// Host-owned durable storage. Overrides only I/O; Agent and Context own execution.
pub trait SessionStore: Send + Sync + std::fmt::Debug {
    fn read(&self, session_id: String) -> StoreFuture<SessionData>;
    fn append(&self, options: WriteEntryOptions) -> StoreFuture<()>;
    fn compact(&self, options: WriteCompactedEntryOptions) -> StoreFuture<()>;
}


pub type AttributeBag = BTreeMap<String, serde_json::Value>;

/// Reserved entry metadata key containing the structured AI message content.
pub const MESSAGE_CONTENT_METADATA_KEY: &str = "otherone_message_content";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeContext {
    #[serde(skip)]
    pub session_store: Option<Arc<dyn SessionStore>>,
    pub partition_key: String,
    #[serde(default)]
    pub attributes: AttributeBag,
}

impl PartialEq for RuntimeContext {
    fn eq(&self, other: &Self) -> bool { self.partition_key == other.partition_key && self.attributes == other.attributes }
}

impl RuntimeContext {
    pub fn new(partition_key: impl Into<String>) -> Self {
        Self {
            session_store: None,
            partition_key: partition_key.into(),
            attributes: AttributeBag::new(),
        }
    }

    pub fn with_session_store(mut self, store: Arc<dyn SessionStore>) -> Self { self.session_store = Some(store); self }

    pub fn legacy_default() -> Self {
        Self::new("default")
    }

    pub fn with_attribute(mut self, key: impl Into<String>, value: serde_json::Value) -> Self {
        self.attributes.insert(key.into(), value);
        self
    }

    pub fn validate(&self) -> Result<(), String> {
        let partition_key = self.partition_key.trim();
        if partition_key.is_empty() {
            return Err("partition_key is required".to_string());
        }
        if partition_key.len() > 256 {
            return Err("partition_key is too long".to_string());
        }
        for (key, value) in &self.attributes {
            validate_attribute_key(key)?;
            validate_attribute_value(value)?;
        }
        Ok(())
    }
}

pub fn empty_attribute_bag() -> AttributeBag {
    AttributeBag::new()
}

pub fn is_attribute_bag_empty(value: &AttributeBag) -> bool {
    value.is_empty()
}

fn validate_attribute_key(key: &str) -> Result<(), String> {
    if key.is_empty() || key.len() > 64 {
        return Err(format!("invalid attribute key: {key}"));
    }
    if !key
        .chars()
        .all(|ch| ch == '_' || ch.is_ascii_lowercase() || ch.is_ascii_digit())
    {
        return Err(format!("invalid attribute key: {key}"));
    }
    Ok(())
}

fn validate_attribute_value(value: &serde_json::Value) -> Result<(), String> {
    match value {
        serde_json::Value::Null | serde_json::Value::Bool(_) | serde_json::Value::Number(_) => {
            Ok(())
        }
        serde_json::Value::String(value) => {
            if value.len() > 2048 {
                Err("attribute string value is too long".to_string())
            } else {
                Ok(())
            }
        }
        serde_json::Value::Array(values) => {
            if values.len() > 32 {
                return Err("attribute array value is too long".to_string());
            }
            for value in values {
                validate_attribute_value(value)?;
            }
            Ok(())
        }
        serde_json::Value::Object(values) => {
            if values.len() > 64 {
                return Err("attribute object value is too large".to_string());
            }
            for (key, value) in values {
                validate_attribute_key(key)?;
                validate_attribute_value(value)?;
            }
            Ok(())
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StorageType {
    LocalFile,
    Database,
    Redis,
    Mysql,
    Mongodb,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum DatabaseType {
    Postgres,
    Mysql,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub user: String,
    pub password: String,
    pub max: Option<u32>,
    pub idle_timeout_millis: Option<u64>,
    pub connection_timeout_millis: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct WriteEntryOptions {
    pub storage_type: StorageType,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub tools: Option<serde_json::Value>,
    pub token_consumption: Option<u32>,
    pub create_at: Option<String>,
    pub database_config: Option<DatabaseConfig>,
    pub runtime_context: Option<RuntimeContext>,
    pub metadata: AttributeBag,
}

#[derive(Debug, Clone)]
pub struct WriteCompactedEntryOptions {
    pub storage_type: StorageType,
    pub session_id: String,
    pub summary: String,
    pub trigger_entry_id: String,
    pub create_at: Option<String>,
    pub database_config: Option<DatabaseConfig>,
    pub runtime_context: Option<RuntimeContext>,
    pub metadata: AttributeBag,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entry {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partition_key: Option<String>,
    pub entry_id: String,
    pub session_id: String,
    pub content: String,
    pub role: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token_consumption: Option<u32>,
    pub status: i16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<serde_json::Value>,
    pub create_at: String,
    pub is_compaction: i16,
    #[serde(default, skip_serializing_if = "is_attribute_bag_empty")]
    pub attributes: AttributeBag,
    #[serde(default, skip_serializing_if = "is_attribute_bag_empty")]
    pub metadata: AttributeBag,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partition_key: Option<String>,
    pub session_id: String,
    pub status: i16,
    pub create_at: String,
    #[serde(default, skip_serializing_if = "is_attribute_bag_empty")]
    pub attributes: AttributeBag,
    #[serde(default, skip_serializing_if = "is_attribute_bag_empty")]
    pub metadata: AttributeBag,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionData {
    pub session: Option<Session>,
    pub entries: Vec<Entry>,
    pub compacted_entries: Vec<CompactedEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompactedEntry {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partition_key: Option<String>,
    pub entry_id: String,
    pub session_id: String,
    pub trigger_entry_id: String,
    pub summary: String,
    pub create_at: String,
    pub status: i16,
    #[serde(default, skip_serializing_if = "is_attribute_bag_empty")]
    pub attributes: AttributeBag,
    #[serde(default, skip_serializing_if = "is_attribute_bag_empty")]
    pub metadata: AttributeBag,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageFile {
    pub sessions: Vec<StorageSession>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageSession {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partition_key: Option<String>,
    pub session_id: String,
    pub status: i16,
    pub create_at: String,
    #[serde(default, skip_serializing_if = "is_attribute_bag_empty")]
    pub attributes: AttributeBag,
    #[serde(default, skip_serializing_if = "is_attribute_bag_empty")]
    pub metadata: AttributeBag,
    #[serde(default)]
    pub entries: Vec<Entry>,
    #[serde(default)]
    pub compacted_entries: Vec<CompactedEntry>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn runtime_context_accepts_arbitrary_business_attributes() {
        let context = RuntimeContext::new("tenant:t1:workspace:w9")
            .with_attribute("tenant_id", serde_json::json!("t1"))
            .with_attribute("workspace_id", serde_json::json!("w9"))
            .with_attribute("project_id", serde_json::json!("p3"));

        assert!(context.validate().is_ok());
        assert_eq!(
            context.attributes.get("project_id"),
            Some(&serde_json::json!("p3"))
        );
    }

    #[test]
    fn runtime_context_rejects_invalid_attribute_keys() {
        let context =
            RuntimeContext::new("user:u1").with_attribute("User Id", serde_json::json!("u1"));

        assert!(context.validate().is_err());
    }
}

use chrono::Utc;
use sqlx_core::query::query;
use sqlx_postgres::Postgres;
use uuid::Uuid;

use crate::error::StorageError;
use crate::types::{AttributeBag, DatabaseConfig, RuntimeContext};

use super::client::create_database_client;

pub async fn create_new_session_in_database(
    config: &DatabaseConfig,
) -> Result<String, StorageError> {
    create_new_session_in_database_with_context(config, &RuntimeContext::legacy_default()).await
}

pub async fn create_new_session_in_database_with_context(
    config: &DatabaseConfig,
    runtime_context: &RuntimeContext,
) -> Result<String, StorageError> {
    runtime_context
        .validate()
        .map_err(StorageError::ConfigError)?;

    let pool = create_database_client(config).await?;
    let session_id = Uuid::new_v4().to_string();
    let attributes_json = json_text(&runtime_context.attributes)?;
    let metadata = AttributeBag::new();
    let metadata_json = json_text(&metadata)?;

    query::<Postgres>(
        "INSERT INTO otherone_session \
         (partition_key, session_id, status, create_at, attributes_json, metadata_json) \
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)",
    )
    .bind(&runtime_context.partition_key)
    .bind(&session_id)
    .bind(0i16)
    .bind(attributes_json)
    .bind(metadata_json)
    .execute(&pool)
    .await?;

    pool.close().await;
    Ok(session_id)
}

pub async fn write_entry_to_database(
    config: &DatabaseConfig,
    runtime_context: &RuntimeContext,
    session_id: &str,
    role: &str,
    content: &str,
    tools: Option<&serde_json::Value>,
    token_consumption: Option<u32>,
    create_at: Option<&str>,
    metadata: &AttributeBag,
) -> Result<(), StorageError> {
    runtime_context
        .validate()
        .map_err(StorageError::ConfigError)?;
    if session_id.is_empty() {
        return Err(StorageError::ConfigError(
            "session_id is required".to_string(),
        ));
    }

    let pool = create_database_client(config).await?;
    let entry_id = Uuid::new_v4().to_string();
    let create_at_dt = parse_create_at(create_at);
    let tools_json = tools.map(json_value_text).transpose()?;
    let attributes_json = json_text(&runtime_context.attributes)?;
    let metadata_json = json_text(metadata)?;

    query::<Postgres>(
        "INSERT INTO otherone_session \
         (partition_key, session_id, status, create_at, attributes_json, metadata_json) \
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5) \
         ON CONFLICT (partition_key, session_id) DO NOTHING",
    )
    .bind(&runtime_context.partition_key)
    .bind(session_id)
    .bind(0i16)
    .bind(&attributes_json)
    .bind(&metadata_json)
    .execute(&pool)
    .await?;

    query::<Postgres>(
        "INSERT INTO otherone_entries \
         (partition_key, entry_id, session_id, content, role, token_consumption, status, tools, create_at, is_compaction, attributes_json, metadata_json) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
    )
    .bind(&runtime_context.partition_key)
    .bind(&entry_id)
    .bind(session_id)
    .bind(content)
    .bind(role)
    .bind(token_consumption.map(|t| t as i32).unwrap_or(0))
    .bind(0i16)
    .bind(&tools_json)
    .bind(create_at_dt)
    .bind(1i16)
    .bind(attributes_json)
    .bind(metadata_json)
    .execute(&pool)
    .await?;

    pool.close().await;
    Ok(())
}

pub async fn write_compacted_entry_to_database(
    config: &DatabaseConfig,
    runtime_context: &RuntimeContext,
    session_id: &str,
    summary: &str,
    trigger_entry_id: &str,
    create_at: Option<&str>,
    metadata: &AttributeBag,
) -> Result<(), StorageError> {
    runtime_context
        .validate()
        .map_err(StorageError::ConfigError)?;
    if session_id.is_empty() {
        return Err(StorageError::ConfigError(
            "session_id is required".to_string(),
        ));
    }

    let pool = create_database_client(config).await?;
    let entry_id = Uuid::new_v4().to_string();
    let create_at_dt = parse_create_at(create_at);
    let attributes_json = json_text(&runtime_context.attributes)?;
    let metadata_json = json_text(metadata)?;

    query::<Postgres>(
        "INSERT INTO otherone_compacted_entries \
         (partition_key, entry_id, session_id, trigger_entry_id, summary, create_at, status, attributes_json, metadata_json) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    )
    .bind(&runtime_context.partition_key)
    .bind(&entry_id)
    .bind(session_id)
    .bind(trigger_entry_id)
    .bind(summary)
    .bind(create_at_dt)
    .bind(0i16)
    .bind(attributes_json)
    .bind(metadata_json)
    .execute(&pool)
    .await?;

    pool.close().await;
    Ok(())
}

fn parse_create_at(create_at: Option<&str>) -> chrono::NaiveDateTime {
    match create_at {
        Some(value) => chrono::NaiveDateTime::parse_from_str(value, "%Y-%m-%dT%H:%M:%S%.fZ")
            .unwrap_or_else(|_| Utc::now().naive_utc()),
        None => Utc::now().naive_utc(),
    }
}

fn json_text(value: &AttributeBag) -> Result<String, StorageError> {
    serde_json::to_string(value).map_err(|error| StorageError::ConfigError(error.to_string()))
}

fn json_value_text(value: &serde_json::Value) -> Result<String, StorageError> {
    serde_json::to_string(value).map_err(|error| StorageError::ConfigError(error.to_string()))
}

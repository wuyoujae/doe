use crate::error::StorageError;
use crate::types::{
    AttributeBag, CompactedEntry, DatabaseConfig, Entry, RuntimeContext, Session, SessionData,
};
use sqlx_core::query_as::query_as;
use sqlx_postgres::Postgres;

use super::client::create_database_client;

pub async fn get_all_sessions_from_database(
    config: &DatabaseConfig,
) -> Result<Vec<Session>, StorageError> {
    get_all_sessions_from_database_with_context(config, &RuntimeContext::legacy_default()).await
}

pub async fn get_all_sessions_from_database_with_context(
    config: &DatabaseConfig,
    runtime_context: &RuntimeContext,
) -> Result<Vec<Session>, StorageError> {
    let sessions =
        get_all_sessions_from_database_with_context_and_internal(config, runtime_context, false)
            .await?;
    Ok(sessions)
}

pub async fn get_all_sessions_from_database_with_context_and_internal(
    config: &DatabaseConfig,
    runtime_context: &RuntimeContext,
    include_internal: bool,
) -> Result<Vec<Session>, StorageError> {
    runtime_context
        .validate()
        .map_err(StorageError::ConfigError)?;

    let pool = create_database_client(config).await?;

    let rows = query_as::<
        Postgres,
        (
            String,
            String,
            i16,
            chrono::NaiveDateTime,
            Option<String>,
            Option<String>,
        ),
    >(
        "SELECT partition_key, session_id, status, create_at, attributes_json, metadata_json \
         FROM otherone_session \
         WHERE partition_key = $1 AND status = 0 \
         ORDER BY create_at DESC",
    )
    .bind(&runtime_context.partition_key)
    .fetch_all(&pool)
    .await?;

    let sessions = rows
        .into_iter()
        .map(
            |(partition_key, session_id, status, create_at, attributes_json, metadata_json)| {
                Session {
                    partition_key: Some(partition_key),
                    session_id,
                    status,
                    create_at: create_at.to_string(),
                    attributes: parse_attributes(attributes_json),
                    metadata: parse_attributes(metadata_json),
                }
            },
        )
        .filter(|session| {
            include_internal
                || session
                    .metadata
                    .get("session_kind")
                    .and_then(|value| value.as_str())
                    != Some("agent_internal")
        })
        .collect();

    pool.close().await;
    Ok(sessions)
}

pub async fn read_session_data_from_database(
    session_id: &str,
    config: &DatabaseConfig,
) -> Result<SessionData, StorageError> {
    read_session_data_from_database_with_context(
        session_id,
        config,
        &RuntimeContext::legacy_default(),
    )
    .await
}

pub async fn read_session_data_from_database_with_context(
    session_id: &str,
    config: &DatabaseConfig,
    runtime_context: &RuntimeContext,
) -> Result<SessionData, StorageError> {
    runtime_context
        .validate()
        .map_err(StorageError::ConfigError)?;
    if session_id.is_empty() {
        return Err(StorageError::ConfigError(
            "session_id is required".to_string(),
        ));
    }

    let pool = create_database_client(config).await?;

    let session_result = query_as::<
        Postgres,
        (
            String,
            String,
            i16,
            chrono::NaiveDateTime,
            Option<String>,
            Option<String>,
        ),
    >(
        "SELECT partition_key, session_id, status, create_at, attributes_json, metadata_json \
         FROM otherone_session \
         WHERE partition_key = $1 AND session_id = $2 AND status = 0",
    )
    .bind(&runtime_context.partition_key)
    .bind(session_id)
    .fetch_optional(&pool)
    .await?;

    let session = match session_result {
        None => {
            pool.close().await;
            return Ok(SessionData {
                session: None,
                entries: Vec::new(),
                compacted_entries: Vec::new(),
            });
        }
        Some((partition_key, sid, status, create_at, attributes_json, metadata_json)) => Session {
            partition_key: Some(partition_key),
            session_id: sid,
            status,
            create_at: create_at.to_string(),
            attributes: parse_attributes(attributes_json),
            metadata: parse_attributes(metadata_json),
        },
    };

    let entries_rows = query_as::<Postgres, (String, String, String, String, String, Option<i32>, i16, Option<String>, chrono::NaiveDateTime, i16, Option<String>, Option<String>)>(
        "SELECT partition_key, entry_id, session_id, content, role, token_consumption, status, tools, create_at, is_compaction, attributes_json, metadata_json \
         FROM otherone_entries \
         WHERE partition_key = $1 AND session_id = $2 AND status = 0 \
         ORDER BY create_at ASC",
    )
    .bind(&runtime_context.partition_key)
    .bind(session_id)
    .fetch_all(&pool)
    .await?;

    let entries = entries_rows
        .into_iter()
        .map(
            |(
                partition_key,
                entry_id,
                sid,
                content,
                role,
                token_consumption,
                status,
                tools,
                create_at,
                is_compaction,
                attributes_json,
                metadata_json,
            )| Entry {
                partition_key: Some(partition_key),
                entry_id,
                session_id: sid,
                content,
                role,
                token_consumption: token_consumption.map(|value| value as u32),
                status,
                tools: tools.and_then(|value| serde_json::from_str(&value).ok()),
                create_at: create_at.to_string(),
                is_compaction,
                attributes: parse_attributes(attributes_json),
                metadata: parse_attributes(metadata_json),
            },
        )
        .collect();

    let compacted_rows = query_as::<Postgres, (String, String, String, String, String, chrono::NaiveDateTime, i16, Option<String>, Option<String>)>(
        "SELECT partition_key, entry_id, session_id, trigger_entry_id, summary, create_at, status, attributes_json, metadata_json \
         FROM otherone_compacted_entries \
         WHERE partition_key = $1 AND session_id = $2 AND status = 0 \
         ORDER BY create_at ASC",
    )
    .bind(&runtime_context.partition_key)
    .bind(session_id)
    .fetch_all(&pool)
    .await?;

    let compacted_entries = compacted_rows
        .into_iter()
        .map(
            |(
                partition_key,
                entry_id,
                sid,
                trigger_entry_id,
                summary,
                create_at,
                status,
                attributes_json,
                metadata_json,
            )| CompactedEntry {
                partition_key: Some(partition_key),
                entry_id,
                session_id: sid,
                trigger_entry_id,
                summary,
                create_at: create_at.to_string(),
                status,
                attributes: parse_attributes(attributes_json),
                metadata: parse_attributes(metadata_json),
            },
        )
        .collect();

    pool.close().await;

    Ok(SessionData {
        session: Some(session),
        entries,
        compacted_entries,
    })
}

fn parse_attributes(raw: Option<String>) -> AttributeBag {
    raw.and_then(|value| serde_json::from_str::<AttributeBag>(&value).ok())
        .unwrap_or_default()
}

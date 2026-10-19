use chrono::Utc;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;
use uuid::Uuid;

use crate::error::StorageError;
use crate::types::{
    AttributeBag, CompactedEntry, DatabaseConfig, Entry, RuntimeContext, Session, SessionData,
};

pub async fn create_mysql_client(config: &DatabaseConfig) -> Result<MySqlPool, StorageError> {
    if config.host.is_empty() {
        return Err(StorageError::ConfigError("host is required".to_string()));
    }
    if config.port == 0 {
        return Err(StorageError::ConfigError("port is required".to_string()));
    }
    if config.database.is_empty() {
        return Err(StorageError::ConfigError(
            "database is required".to_string(),
        ));
    }
    if config.user.is_empty() {
        return Err(StorageError::ConfigError("user is required".to_string()));
    }
    if config.password.is_empty() {
        return Err(StorageError::ConfigError(
            "password is required".to_string(),
        ));
    }

    let database_url = format!(
        "mysql://{}:{}@{}:{}/{}",
        config.user, config.password, config.host, config.port, config.database
    );

    let pool = MySqlPoolOptions::new()
        .max_connections(config.max.unwrap_or(10))
        .connect(&database_url)
        .await?;

    Ok(pool)
}

pub async fn init_mysql_database(config: &DatabaseConfig) -> Result<(), StorageError> {
    let pool = create_mysql_client(config).await?;

    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS otherone_session (
            partition_key VARCHAR(256) NOT NULL,
            session_id VARCHAR(128) NOT NULL,
            status SMALLINT NOT NULL DEFAULT 0,
            create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL,
            attributes_json TEXT,
            metadata_json TEXT,
            PRIMARY KEY (partition_key, session_id),
            INDEX idx_session_partition_status_create_at (partition_key, status, create_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS otherone_entries (
            partition_key VARCHAR(256) NOT NULL,
            entry_id VARCHAR(36) NOT NULL,
            session_id VARCHAR(128) NOT NULL,
            content TEXT NOT NULL,
            role VARCHAR(50) NOT NULL,
            token_consumption INT DEFAULT 0,
            status SMALLINT NOT NULL DEFAULT 0,
            tools TEXT,
            create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_compaction SMALLINT NOT NULL DEFAULT 1,
            attributes_json TEXT,
            metadata_json TEXT,
            PRIMARY KEY (partition_key, entry_id),
            INDEX idx_entries_partition_session_create_at (partition_key, session_id, create_at),
            INDEX idx_entries_partition_status (partition_key, status),
            CONSTRAINT fk_entries_session
                FOREIGN KEY (partition_key, session_id)
                REFERENCES otherone_session(partition_key, session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS otherone_compacted_entries (
            partition_key VARCHAR(256) NOT NULL,
            entry_id VARCHAR(36) NOT NULL,
            session_id VARCHAR(128) NOT NULL,
            trigger_entry_id VARCHAR(36) NOT NULL,
            summary TEXT NOT NULL,
            create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            status SMALLINT NOT NULL DEFAULT 0,
            attributes_json TEXT,
            metadata_json TEXT,
            PRIMARY KEY (partition_key, entry_id),
            INDEX idx_compacted_partition_session_create_at (partition_key, session_id, create_at),
            CONSTRAINT fk_compacted_session
                FOREIGN KEY (partition_key, session_id)
                REFERENCES otherone_session(partition_key, session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS otherone_attribute_index (
            partition_key VARCHAR(256) NOT NULL,
            entity_type VARCHAR(32) NOT NULL,
            entity_id VARCHAR(128) NOT NULL,
            attribute_source VARCHAR(32) NOT NULL,
            attribute_key VARCHAR(64) NOT NULL,
            value_type VARCHAR(32) NOT NULL,
            value_text TEXT,
            value_hash VARCHAR(64),
            create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_attribute_partition_key_hash (partition_key, attribute_key, value_hash),
            INDEX idx_attribute_partition_entity_key (partition_key, entity_type, attribute_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"#,
    )
    .execute(&pool)
    .await?;

    pool.close().await;
    Ok(())
}

pub async fn create_session_mysql(config: &DatabaseConfig) -> Result<String, StorageError> {
    create_session_mysql_with_context(config, &RuntimeContext::legacy_default()).await
}

pub async fn create_session_mysql_with_context(
    config: &DatabaseConfig,
    runtime_context: &RuntimeContext,
) -> Result<String, StorageError> {
    runtime_context
        .validate()
        .map_err(StorageError::ConfigError)?;
    let pool = create_mysql_client(config).await?;
    let session_id = Uuid::new_v4().to_string();
    let attributes_json = json_text(&runtime_context.attributes)?;
    let metadata = AttributeBag::new();
    let metadata_json = json_text(&metadata)?;

    sqlx::query(
        "INSERT INTO otherone_session \
         (partition_key, session_id, status, attributes_json, metadata_json) \
         VALUES (?, ?, ?, ?, ?)",
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

pub async fn write_entry_mysql(
    config: &DatabaseConfig,
    runtime_context: &RuntimeContext,
    session_id: &str,
    role: &str,
    content: &str,
    tools: Option<&serde_json::Value>,
    token_consumption: Option<u32>,
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

    let pool = create_mysql_client(config).await?;
    let entry_id = Uuid::new_v4().to_string();
    let tools_json = tools.map(json_value_text).transpose()?;
    let attributes_json = json_text(&runtime_context.attributes)?;
    let metadata_json = json_text(metadata)?;

    sqlx::query(
        "INSERT INTO otherone_session \
         (partition_key, session_id, status, attributes_json, metadata_json) \
         VALUES (?, ?, ?, ?, ?) \
         ON DUPLICATE KEY UPDATE session_id = session_id",
    )
    .bind(&runtime_context.partition_key)
    .bind(session_id)
    .bind(0i16)
    .bind(&attributes_json)
    .bind(&metadata_json)
    .execute(&pool)
    .await?;

    sqlx::query(
        "INSERT INTO otherone_entries \
         (partition_key, entry_id, session_id, content, role, token_consumption, tools, create_at, attributes_json, metadata_json) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&runtime_context.partition_key)
    .bind(&entry_id)
    .bind(session_id)
    .bind(content)
    .bind(role)
    .bind(token_consumption.map(|t| t as i32).unwrap_or(0))
    .bind(&tools_json)
    .bind(Utc::now().naive_utc())
    .bind(attributes_json)
    .bind(metadata_json)
    .execute(&pool)
    .await?;

    pool.close().await;
    Ok(())
}

pub async fn write_compacted_entry_mysql(
    config: &DatabaseConfig,
    runtime_context: &RuntimeContext,
    session_id: &str,
    summary: &str,
    trigger_entry_id: &str,
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

    let pool = create_mysql_client(config).await?;
    let entry_id = Uuid::new_v4().to_string();
    let attributes_json = json_text(&runtime_context.attributes)?;
    let metadata_json = json_text(metadata)?;

    sqlx::query(
        "INSERT INTO otherone_compacted_entries \
         (partition_key, entry_id, session_id, trigger_entry_id, summary, create_at, attributes_json, metadata_json) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&runtime_context.partition_key)
    .bind(&entry_id)
    .bind(session_id)
    .bind(trigger_entry_id)
    .bind(summary)
    .bind(Utc::now().naive_utc())
    .bind(attributes_json)
    .bind(metadata_json)
    .execute(&pool)
    .await?;

    pool.close().await;
    Ok(())
}

pub async fn get_all_sessions_mysql(config: &DatabaseConfig) -> Result<Vec<Session>, StorageError> {
    get_all_sessions_mysql_with_context(config, &RuntimeContext::legacy_default()).await
}

pub async fn get_all_sessions_mysql_with_context(
    config: &DatabaseConfig,
    runtime_context: &RuntimeContext,
) -> Result<Vec<Session>, StorageError> {
    runtime_context
        .validate()
        .map_err(StorageError::ConfigError)?;
    let pool = create_mysql_client(config).await?;
    let rows = sqlx::query_as::<
        _,
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
         WHERE partition_key = ? AND status = 0 \
         ORDER BY create_at DESC",
    )
    .bind(&runtime_context.partition_key)
    .fetch_all(&pool)
    .await?;

    let sessions = rows
        .into_iter()
        .map(
            |(partition_key, sid, status, ca, attributes_json, metadata_json)| Session {
                partition_key: Some(partition_key),
                session_id: sid,
                status,
                create_at: ca.to_string(),
                attributes: parse_attributes(attributes_json),
                metadata: parse_attributes(metadata_json),
            },
        )
        .collect();
    pool.close().await;
    Ok(sessions)
}

pub async fn read_session_mysql(
    session_id: &str,
    config: &DatabaseConfig,
) -> Result<SessionData, StorageError> {
    read_session_mysql_with_context(session_id, config, &RuntimeContext::legacy_default()).await
}

pub async fn read_session_mysql_with_context(
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
    let pool = create_mysql_client(config).await?;

    let session_opt = sqlx::query_as::<
        _,
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
         WHERE partition_key = ? AND session_id = ? AND status = 0",
    )
    .bind(&runtime_context.partition_key)
    .bind(session_id)
    .fetch_optional(&pool)
    .await?;

    let session = match session_opt {
        None => {
            pool.close().await;
            return Ok(SessionData {
                session: None,
                entries: vec![],
                compacted_entries: vec![],
            });
        }
        Some((partition_key, sid, status, ca, attributes_json, metadata_json)) => Session {
            partition_key: Some(partition_key),
            session_id: sid,
            status,
            create_at: ca.to_string(),
            attributes: parse_attributes(attributes_json),
            metadata: parse_attributes(metadata_json),
        },
    };

    let entry_rows = sqlx::query_as::<_, (String, String, String, String, String, Option<i32>, i16, Option<String>, chrono::NaiveDateTime, i16, Option<String>, Option<String>)>(
        "SELECT partition_key, entry_id, session_id, content, role, token_consumption, status, tools, create_at, is_compaction, attributes_json, metadata_json \
         FROM otherone_entries \
         WHERE partition_key = ? AND session_id = ? AND status = 0 \
         ORDER BY create_at ASC",
    )
    .bind(&runtime_context.partition_key)
    .bind(session_id)
    .fetch_all(&pool)
    .await?;

    let entries = entry_rows
        .into_iter()
        .map(
            |(
                partition_key,
                eid,
                sid,
                content,
                role,
                token_consumption,
                status,
                tools,
                ca,
                is_compaction,
                attributes_json,
                metadata_json,
            )| Entry {
                partition_key: Some(partition_key),
                entry_id: eid,
                session_id: sid,
                content,
                role,
                token_consumption: token_consumption.map(|v| v as u32),
                status,
                tools: tools.and_then(|value| serde_json::from_str(&value).ok()),
                create_at: ca.to_string(),
                is_compaction,
                attributes: parse_attributes(attributes_json),
                metadata: parse_attributes(metadata_json),
            },
        )
        .collect();

    let compacted_rows = sqlx::query_as::<_, (String, String, String, String, String, chrono::NaiveDateTime, i16, Option<String>, Option<String>)>(
        "SELECT partition_key, entry_id, session_id, trigger_entry_id, summary, create_at, status, attributes_json, metadata_json \
         FROM otherone_compacted_entries \
         WHERE partition_key = ? AND session_id = ? AND status = 0 \
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

fn json_text(value: &AttributeBag) -> Result<String, StorageError> {
    serde_json::to_string(value).map_err(|error| StorageError::ConfigError(error.to_string()))
}

fn json_value_text(value: &serde_json::Value) -> Result<String, StorageError> {
    serde_json::to_string(value).map_err(|error| StorageError::ConfigError(error.to_string()))
}

fn parse_attributes(raw: Option<String>) -> AttributeBag {
    raw.and_then(|value| serde_json::from_str::<AttributeBag>(&value).ok())
        .unwrap_or_default()
}

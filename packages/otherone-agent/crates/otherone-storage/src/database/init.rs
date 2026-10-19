use sqlx_core::query::query;
use sqlx_postgres::Postgres;
use tracing::info;

use crate::error::StorageError;
use crate::types::DatabaseConfig;

use super::client::create_database_client;

pub async fn init_database(config: &DatabaseConfig) -> Result<(), StorageError> {
    let pool = create_database_client(config).await?;

    query::<Postgres>(
        r#"
        CREATE TABLE IF NOT EXISTS otherone_session (
            partition_key VARCHAR(256) NOT NULL,
            session_id VARCHAR(128) NOT NULL,
            status SMALLINT NOT NULL DEFAULT 0,
            create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP,
            attributes_json TEXT,
            metadata_json TEXT,
            PRIMARY KEY (partition_key, session_id)
        )
        "#,
    )
    .execute(&pool)
    .await?;

    query::<Postgres>(
        "CREATE INDEX IF NOT EXISTS idx_session_partition_status_create_at \
         ON otherone_session(partition_key, status, create_at DESC)",
    )
    .execute(&pool)
    .await?;

    query::<Postgres>(
        r#"
        CREATE TABLE IF NOT EXISTS otherone_entries (
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
            FOREIGN KEY (partition_key, session_id)
                REFERENCES otherone_session(partition_key, session_id)
        )
        "#,
    )
    .execute(&pool)
    .await?;

    query::<Postgres>(
        "CREATE INDEX IF NOT EXISTS idx_entries_partition_session_create_at \
         ON otherone_entries(partition_key, session_id, create_at)",
    )
    .execute(&pool)
    .await?;

    query::<Postgres>(
        "CREATE INDEX IF NOT EXISTS idx_entries_partition_status \
         ON otherone_entries(partition_key, status)",
    )
    .execute(&pool)
    .await?;

    query::<Postgres>(
        r#"
        CREATE TABLE IF NOT EXISTS otherone_compacted_entries (
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
            FOREIGN KEY (partition_key, session_id)
                REFERENCES otherone_session(partition_key, session_id)
        )
        "#,
    )
    .execute(&pool)
    .await?;

    query::<Postgres>(
        "CREATE INDEX IF NOT EXISTS idx_compacted_partition_session_create_at \
         ON otherone_compacted_entries(partition_key, session_id, create_at)",
    )
    .execute(&pool)
    .await?;

    query::<Postgres>(
        r#"
        CREATE TABLE IF NOT EXISTS otherone_attribute_index (
            partition_key VARCHAR(256) NOT NULL,
            entity_type VARCHAR(32) NOT NULL,
            entity_id VARCHAR(128) NOT NULL,
            attribute_source VARCHAR(32) NOT NULL,
            attribute_key VARCHAR(64) NOT NULL,
            value_type VARCHAR(32) NOT NULL,
            value_text TEXT,
            value_hash VARCHAR(64),
            create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await?;

    query::<Postgres>(
        "CREATE INDEX IF NOT EXISTS idx_attribute_partition_key_hash \
         ON otherone_attribute_index(partition_key, attribute_key, value_hash)",
    )
    .execute(&pool)
    .await?;

    pool.close().await;
    info!("Database initialized successfully");

    Ok(())
}

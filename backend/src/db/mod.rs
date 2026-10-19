use rusqlite::{Connection, TransactionBehavior};
use std::{path::Path, time::Duration};

pub fn connect(path: &Path) -> rusqlite::Result<Connection> {
    let connection = Connection::open(path)?;
    connection.busy_timeout(Duration::from_secs(5))?;
    connection.pragma_update(None, "foreign_keys", true)?;
    connection.pragma_update(None, "synchronous", "FULL")?;
    Ok(connection)
}

pub fn migrate(
    connection: &mut Connection,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    connection.pragma_update(None, "journal_mode", "WAL")?;
    let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
    tx.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY CHECK (version > 0),
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
    ) STRICT;",
    )?;
    let version: u32 = tx.pragma_query_value(None, "user_version", |row| row.get(0))?;
    let recorded: u32 = tx.query_row(
        "SELECT coalesce(max(version),0) FROM schema_migrations",
        [],
        |row| row.get(0),
    )?;
    if recorded != version {
        return Err(
            "Database migration history is inconsistent; restore a consistent backup".into(),
        );
    }
    const MIGRATIONS: &[(&str, &str)] = &[
        (
            "0001_model_settings",
            include_str!("../../migrations/0001_model_settings.sql"),
        ),
        (
            "0002_provider_catalog",
            include_str!("../../migrations/0002_provider_catalog.sql"),
        ),
        (
            "0003_doe_settings",
            include_str!("../../migrations/0003_doe_settings.sql"),
        ),
        (
            "0004_generation",
            include_str!("../../migrations/0004_generation.sql"),
        ),
        (
            "0005_conversation",
            include_str!("../../migrations/0005_conversation.sql"),
        ),
        (
            "0006_attachments",
            include_str!("../../migrations/0006_attachments.sql"),
        ),
        (
            "0007_exports",
            include_str!("../../migrations/0007_exports.sql"),
        ),
        (
            "0008_playback",
            include_str!("../../migrations/0008_playback.sql"),
        ),
    ];
    if version as usize > MIGRATIONS.len() {
        return Err("Database schema is newer than this application; preserve it and use a compatible binary".into());
    }
    for (index, (name, _)) in MIGRATIONS.iter().enumerate().take(version as usize) {
        let recorded_name: String = tx.query_row(
            "SELECT name FROM schema_migrations WHERE version=?1",
            [index + 1],
            |row| row.get(0),
        )?;
        if recorded_name != *name {
            return Err("Database migration history does not match this application".into());
        }
    }
    for (index, (name, sql)) in MIGRATIONS.iter().enumerate().skip(version as usize) {
        tx.execute_batch(sql)?;
        tx.execute("INSERT INTO schema_migrations(version,name,applied_at) VALUES (?1,?2,strftime('%Y-%m-%dT%H:%M:%fZ','now'))", rusqlite::params![index + 1, name])?;
        tx.pragma_update(None, "user_version", index + 1)?;
    }
    // The shared catalog is authoritative; a removed provider in use fails safely via the FK.
    tx.execute("INSERT OR IGNORE INTO model_provider_kinds(provider,kind) SELECT p.key,k.value FROM json_each(?1) p, json_each(p.value,'$.kinds') k", [crate::models::catalog::JSON])?;
    tx.execute("DELETE FROM model_provider_kinds AS current WHERE NOT EXISTS (SELECT 1 FROM json_each(?1) p, json_each(p.value,'$.kinds') k WHERE p.key=current.provider AND k.value=current.kind)", [crate::models::catalog::JSON])?;
    tx.commit()?;
    Ok(())
}

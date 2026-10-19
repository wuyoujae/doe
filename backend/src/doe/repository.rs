use super::{
    Entry, MAX_CONTENT_BYTES, MAX_ENTRY_BYTES, MAX_SKILL_BYTES, SaveSettings, SettingsSnapshot,
    defaults,
};
use crate::db;
use rusqlite::{Connection, TransactionBehavior, params};
use std::{
    collections::BTreeSet,
    path::{Path, PathBuf},
};

#[derive(Debug, thiserror::Error)]
pub enum SettingsError {
    #[error("{message}")]
    Validation {
        field: String,
        message: &'static str,
    },
    #[error("The DOE settings changed; reload before saving")]
    Conflict,
    #[error("DOE settings storage is unavailable")]
    Storage(#[source] Box<dyn std::error::Error + Send + Sync>),
}

impl SettingsError {
    pub fn internal(error: impl Into<Box<dyn std::error::Error + Send + Sync>>) -> Self {
        Self::Storage(error.into())
    }
    fn invalid(field: impl Into<String>, message: &'static str) -> Self {
        Self::Validation {
            field: field.into(),
            message,
        }
    }
}
impl From<rusqlite::Error> for SettingsError {
    fn from(error: rusqlite::Error) -> Self {
        Self::internal(error)
    }
}
impl From<serde_json::Error> for SettingsError {
    fn from(error: serde_json::Error) -> Self {
        Self::internal(error)
    }
}

pub struct Repository {
    pub(super) path: PathBuf,
}

impl Repository {
    /// The host initializes the shared database before opening this domain repository.
    pub fn open(data_dir: &Path) -> Result<Self, SettingsError> {
        let repository = Self {
            path: data_dir.join("yrkie.sqlite3"),
        };
        let defaults = defaults::load()?;
        repository.sync_defaults(defaults)?;
        Ok(repository)
    }

    fn sync_defaults(&self, defaults: Vec<Entry>) -> Result<(), SettingsError> {
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let old = snapshot(&tx)?;
        // Removing a resource is an explicit data migration, never implicit deletion at startup.
        if old
            .entries
            .iter()
            .any(|entry| !defaults.iter().any(|next| next.id == entry.id))
        {
            return Err(SettingsError::internal(
                "Bundled DOE resources removed a persisted identity; a migration is required",
            ));
        }
        let changed = defaults.len() != old.entries.len()
            || defaults.iter().enumerate().any(|(index, entry)| {
                old.entries.get(index).is_none_or(|old| {
                    old.id != entry.id
                        || old.kind != entry.kind
                        || old.name != entry.name
                        || old.description != entry.description
                        || old.default_content != entry.default_content
                        || old.default_enabled != entry.default_enabled
                        || old.source != entry.source
                })
            });
        if !changed {
            tx.commit()?;
            return Ok(());
        }
        for (ordinal, entry) in defaults.iter().enumerate() {
            if old
                .entries
                .iter()
                .any(|old| old.id == entry.id && old.kind != entry.kind)
            {
                return Err(SettingsError::internal(
                    "A DOE resource kind changed; a migration is required",
                ));
            }
            tx.execute("INSERT INTO doe_defaults(id,kind,name,description,content,enabled,source_json,ordinal) VALUES (?1,?2,?3,?4,?5,?6,?7,?8) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,content=excluded.content,enabled=excluded.enabled,source_json=excluded.source_json,ordinal=excluded.ordinal",
                params![entry.id,entry.kind,entry.name,entry.description,entry.default_content,entry.default_enabled,serde_json::to_string(&entry.source)?,ordinal])?;
        }
        // Equal overrides have become defaults again; do not pin them across later upgrades.
        tx.execute("DELETE FROM doe_overrides WHERE (content IS NULL OR content=(SELECT content FROM doe_defaults WHERE id=entry_id)) AND (enabled IS NULL OR enabled=(SELECT enabled FROM doe_defaults WHERE id=entry_id))", [])?;
        tx.execute("UPDATE doe_overrides SET content=NULLIF(content,(SELECT content FROM doe_defaults WHERE id=entry_id)),enabled=NULLIF(enabled,(SELECT enabled FROM doe_defaults WHERE id=entry_id))", [])?;
        if !old.entries.is_empty() {
            advance(&tx)?;
        }
        let next = snapshot(&tx)?;
        validate_effective(&next)?;
        record(&tx)?;
        tx.commit()?;
        Ok(())
    }

    pub fn read(&self) -> Result<SettingsSnapshot, SettingsError> {
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction()?;
        let value = snapshot(&tx)?;
        tx.commit()?;
        Ok(value)
    }

    pub fn save(&self, request: SaveSettings) -> Result<SettingsSnapshot, SettingsError> {
        if request.revision >= 9_007_199_254_740_991 {
            return Err(SettingsError::invalid("revision", "Invalid revision"));
        }
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let current = snapshot(&tx)?;
        if request.revision != current.revision {
            return Err(SettingsError::Conflict);
        }
        if request.entries.len() != current.entries.len() {
            return Err(SettingsError::invalid(
                "entries",
                "Include every DOE configuration entry exactly once",
            ));
        }
        let mut seen = BTreeSet::new();
        let mut total = 0;
        let mut changed = false;
        for input in &request.entries {
            let entry = current
                .entries
                .iter()
                .find(|entry| entry.id == input.id)
                .filter(|_| seen.insert(input.id.as_str()))
                .ok_or_else(|| {
                    SettingsError::invalid("entries", "Unknown or duplicate DOE entry")
                })?;
            validate_content(entry, &input.content, input.enabled)?;
            total += input.content.len();
            changed |= entry.content != input.content || entry.enabled != input.enabled;
        }
        if total > MAX_CONTENT_BYTES {
            return Err(SettingsError::invalid(
                "entries",
                "DOE configuration exceeds the total content limit",
            ));
        }
        if !changed {
            tx.commit()?;
            return Ok(current);
        }
        for input in request.entries {
            let default = current
                .entries
                .iter()
                .find(|entry| entry.id == input.id)
                .ok_or_else(|| SettingsError::internal("DOE identity missing after validation"))?;
            let content = (input.content != default.default_content).then_some(input.content);
            let enabled = (input.enabled != default.default_enabled).then_some(input.enabled);
            if content.is_none() && enabled.is_none() {
                tx.execute("DELETE FROM doe_overrides WHERE entry_id=?1", [&input.id])?;
            } else {
                tx.execute("INSERT INTO doe_overrides(entry_id,content,enabled) VALUES (?1,?2,?3) ON CONFLICT(entry_id) DO UPDATE SET content=excluded.content,enabled=excluded.enabled", params![input.id,content,enabled])?;
            }
        }
        advance(&tx)?;
        record(&tx)?;
        let saved = snapshot(&tx)?;
        tx.commit()?;
        Ok(saved)
    }
}

fn advance(connection: &Connection) -> Result<(), SettingsError> {
    let changed = connection.execute("UPDATE doe_settings_state SET revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1 AND revision<9007199254740991", [])?;
    if changed != 1 {
        return Err(SettingsError::internal(
            "DOE configuration revision exhausted",
        ));
    }
    Ok(())
}

fn record(connection: &Connection) -> Result<(), SettingsError> {
    connection.execute("INSERT INTO doe_revisions(revision,entry_id,kind,name,description,content,enabled,source_json,created_at) SELECT s.revision,d.id,d.kind,d.name,d.description,coalesce(o.content,d.content),coalesce(o.enabled,d.enabled),d.source_json,s.updated_at FROM doe_defaults d CROSS JOIN doe_settings_state s LEFT JOIN doe_overrides o ON o.entry_id=d.id", [])?;
    Ok(())
}

fn snapshot(connection: &Connection) -> Result<SettingsSnapshot, SettingsError> {
    let revision = connection.query_row(
        "SELECT revision FROM doe_settings_state WHERE id=1",
        [],
        |row| row.get(0),
    )?;
    let mut statement = connection.prepare("SELECT d.id,d.kind,d.name,d.description,coalesce(o.content,d.content),d.content,coalesce(o.enabled,d.enabled),d.enabled,d.source_json FROM doe_defaults d LEFT JOIN doe_overrides o ON o.entry_id=d.id ORDER BY d.ordinal,d.id")?;
    let entries = statement
        .query_map([], |row| {
            let content: String = row.get(4)?;
            let default_content: String = row.get(5)?;
            let enabled: bool = row.get(6)?;
            let default_enabled: bool = row.get(7)?;
            let source: String = row.get(8)?;
            let source = serde_json::from_str(&source).map_err(|error| {
                rusqlite::Error::FromSqlConversionFailure(
                    8,
                    rusqlite::types::Type::Text,
                    Box::new(error),
                )
            })?;
            Ok(Entry {
                id: row.get(0)?,
                kind: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                is_modified: content != default_content || enabled != default_enabled,
                content,
                default_content,
                enabled,
                default_enabled,
                source,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(SettingsSnapshot { revision, entries })
}

fn validate_content(entry: &Entry, content: &str, enabled: bool) -> Result<(), SettingsError> {
    let limit = if entry.kind == "skill" {
        MAX_SKILL_BYTES
    } else {
        MAX_ENTRY_BYTES
    };
    if content.trim().is_empty() || content.contains('\0') || content.len() > limit {
        return Err(SettingsError::invalid(
            format!("entries.{}.content", entry.id),
            "Content must be nonempty UTF-8 text within the entry size limit",
        ));
    }
    if entry.kind != "skill" && !enabled {
        return Err(SettingsError::invalid(
            format!("entries.{}.enabled", entry.id),
            "Required DOE prompts and schemas cannot be disabled",
        ));
    }
    Ok(())
}

fn validate_effective(snapshot: &SettingsSnapshot) -> Result<(), SettingsError> {
    for entry in &snapshot.entries {
        validate_content(entry, &entry.content, entry.enabled)?;
    }
    if snapshot
        .entries
        .iter()
        .map(|entry| entry.content.len())
        .sum::<usize>()
        > MAX_CONTENT_BYTES
    {
        return Err(SettingsError::internal(
            "The effective DOE resource bundle is too large",
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_upgrade_preserves_explicit_overrides_and_freezes_a_new_revision() {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../test/20261018-doe-settings-backend")
            .join(format!(
                "default-upgrade-{}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .expect("clock")
                    .as_nanos()
            ));
        crate::models::Repository::open(&path).expect("database");
        let repository = Repository::open(&path).expect("resources");
        let initial = repository.read().expect("defaults");
        let entries = initial
            .entries
            .iter()
            .map(|entry| super::super::EntryInput {
                id: entry.id.clone(),
                content: if entry.id == "doe.agent.system" {
                    "Local system instructions".into()
                } else {
                    entry.content.clone()
                },
                enabled: entry.enabled,
            })
            .collect();
        repository
            .save(SaveSettings {
                revision: 0,
                entries,
            })
            .expect("override");
        let mut defaults = defaults::load().expect("resources");
        defaults[0].default_content = "Upgraded default system instructions".into();
        defaults[0].content = defaults[0].default_content.clone();
        defaults[1].default_content = "Upgraded schema instructions".into();
        defaults[1].content = defaults[1].default_content.clone();
        repository.sync_defaults(defaults.clone()).expect("upgrade");
        let upgraded = repository.read().expect("upgraded");
        assert_eq!(upgraded.revision, 2);
        assert_eq!(upgraded.entries[0].content, "Local system instructions");
        assert_eq!(
            upgraded.entries[0].default_content,
            "Upgraded default system instructions"
        );
        assert_eq!(upgraded.entries[1].content, "Upgraded schema instructions");
        repository.sync_defaults(defaults).expect("idempotent boot");
        assert_eq!(repository.read().expect("no extra revision").revision, 2);
        let mut matching_defaults = defaults::load().expect("resources");
        matching_defaults[0].default_content = "Local system instructions".into();
        repository
            .sync_defaults(matching_defaults)
            .expect("default catches up with override");
        let connection = db::connect(&path.join("yrkie.sqlite3")).expect("database");
        let count: u64 = connection
            .query_row("SELECT count(*) FROM doe_overrides", [], |row| row.get(0))
            .expect("overrides");
        assert_eq!(count, 0);
        drop(connection);
        repository
            .sync_defaults(defaults::load().expect("original defaults"))
            .expect("later upgrade follows defaults");
        assert_eq!(
            repository.read().expect("current").entries[0].content,
            initial.entries[0].content
        );
    }
}

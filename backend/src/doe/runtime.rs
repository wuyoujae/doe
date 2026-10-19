use super::{Repository, SettingsError};
use crate::db;
use rusqlite::{OptionalExtension, params};
use serde::Serialize;

#[derive(Serialize)]
pub struct SkillDescriptor {
    pub id: String,
    pub name: String,
    pub description: String,
}

/// Keep this revision with a run; subsequent skill reads never follow mutable defaults.
pub struct ResolvedDoe {
    pub revision: u64,
    pub system_prompt: String,
    pub outline_schema: String,
    pub slide_schema: String,
    pub skills: Vec<SkillDescriptor>,
}

impl Repository {
    pub fn resolve(&self) -> Result<ResolvedDoe, SettingsError> {
        let snapshot = self.read()?;
        let required = |id| {
            snapshot
                .entries
                .iter()
                .find(|entry| entry.id == id && entry.enabled)
                .map(|entry| entry.content.clone())
                .ok_or_else(|| {
                    SettingsError::internal("A required DOE runtime resource is missing")
                })
        };
        Ok(ResolvedDoe {
            revision: snapshot.revision,
            system_prompt: required("doe.agent.system")?,
            outline_schema: required("doe.outline.schema")?,
            slide_schema: required("doe.slide.schema")?,
            skills: snapshot
                .entries
                .into_iter()
                .filter(|entry| entry.kind == "skill" && entry.enabled)
                .map(|entry| SkillDescriptor {
                    id: entry.id,
                    name: entry.name,
                    description: entry.description,
                })
                .collect(),
        })
    }

    pub fn read_skill(&self, revision: u64, id: &str) -> Result<Option<String>, SettingsError> {
        if revision > 9_007_199_254_740_991 || id.len() > 128 {
            return Ok(None);
        }
        let connection = db::connect(&self.path)?;
        Ok(connection.query_row("SELECT content FROM doe_revisions WHERE revision=?1 AND entry_id=?2 AND kind='skill' AND enabled=1", params![revision,id], |row|row.get(0)).optional()?)
    }
}

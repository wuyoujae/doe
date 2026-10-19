//! DOE configuration is independent of commercial accounts, projects and agent execution.
pub mod compiler;
mod defaults;
mod repository;
mod runtime;

pub use repository::{Repository, SettingsError};
pub use runtime::{ResolvedDoe, SkillDescriptor};
use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const MAX_ENTRY_BYTES: usize = 512 * 1024;
pub const MAX_SKILL_BYTES: usize = 64 * 1024;
pub const MAX_CONTENT_BYTES: usize = 2 * 1024 * 1024;
pub const MAX_BODY_BYTES: usize = 8 * 1024 * 1024;
pub const REQUIRED_IDS: [&str; 3] = ["doe.agent.system", "doe.outline.schema", "doe.slide.schema"];

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
    pub kind: String,
    pub name: String,
    pub description: String,
    pub content: String,
    pub default_content: String,
    pub enabled: bool,
    pub default_enabled: bool,
    pub is_modified: bool,
    pub source: Value,
}

#[derive(Serialize)]
pub struct SettingsSnapshot {
    pub revision: u64,
    pub entries: Vec<Entry>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EntryInput {
    pub id: String,
    pub content: String,
    pub enabled: bool,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SaveSettings {
    pub revision: u64,
    pub entries: Vec<EntryInput>,
}

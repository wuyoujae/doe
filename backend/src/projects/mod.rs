//! Local projects, generation fences, and independent editor revisions.
mod browser_snapshot;
mod conversation;
pub use browser_snapshot::{BrowserSnapshot, BrowserSnapshotInput};
mod edit;
mod outline;
mod reasoning_history;
mod repository;
mod runs;
mod validation;

pub use conversation::{ConversationEvent, ConversationPage};
pub use repository::Repository;
use serde::{Deserialize, Serialize};
use serde_json::Value;
pub use validation::questions as validate_questions;
pub(crate) use validation::{hash, project_id, request_id};

pub const MAX_DECK_BYTES: usize = 8 * 1024 * 1024;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("The project was not found")]
    NotFound,
    #[error("The project changed; reload before continuing")]
    Conflict,
    #[error("A generation is already active")]
    Busy,
    #[error("This generation is no longer active")]
    Inactive,
    #[error("{0}")]
    Invalid(&'static str),
    #[error("The request identifier has already been used for another payload")]
    Idempotency,
    #[error("Project storage is unavailable")]
    Storage(#[source] Box<dyn std::error::Error + Send + Sync>),
}
impl Error {
    pub fn internal(error: impl Into<Box<dyn std::error::Error + Send + Sync>>) -> Self {
        Self::Storage(error.into())
    }
}
impl From<rusqlite::Error> for Error {
    fn from(error: rusqlite::Error) -> Self {
        Self::internal(error)
    }
}
impl From<serde_json::Error> for Error {
    fn from(error: serde_json::Error) -> Self {
        Self::internal(error)
    }
}
impl From<std::io::Error> for Error {
    fn from(error: std::io::Error) -> Self {
        Self::internal(error)
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RunStage {
    Outline,
    Slides,
    Edit,
}
impl RunStage {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Outline => "outline",
            Self::Slides => "slides",
            Self::Edit => "edit",
        }
    }
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OutlineSnapshot {
    pub markdown: String,
    pub document: Value,
    pub revision: u64,
    pub confirmed: bool,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSchemaDeck {
    pub session_id: String,
    pub status: String,
    pub revision: u64,
    pub created_at: String,
    pub updated_at: String,
    pub deck: Value,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Question {
    pub id: String,
    pub question: String,
    #[serde(default)]
    pub options: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunEvent {
    pub sequence: u64,
    pub kind: String,
    pub message: String,
    pub created_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunSnapshot {
    pub id: String,
    pub stage: RunStage,
    pub status: String,
    pub message: String,
    pub error_code: Option<String>,
    pub questions: Vec<Question>,
    pub events: Vec<RunEvent>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSnapshot {
    pub id: String,
    pub title: String,
    pub prompt: String,
    pub status: String,
    pub revision: u64,
    pub created_at: String,
    pub updated_at: String,
    pub outline: Option<OutlineSnapshot>,
    pub schema_deck: Option<SessionSchemaDeck>,
    pub run: Option<RunSnapshot>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    pub id: String,
    pub title: String,
    pub prompt: String,
    pub status: String,
    pub revision: u64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreateProject {
    pub prompt: String,
    pub request_id: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub upload_ids: Vec<String>,
}

#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Answer {
    pub id: String,
    pub answer: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Action {
    Answer,
    Revise,
    Confirm,
    Retry,
    Cancel,
    Chat,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProjectAction {
    pub action: Action,
    pub expected_revision: u64,
    pub request_id: String,
    pub message: Option<String>,
    pub answers: Option<Vec<Answer>>,
    pub outline_markdown: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expected_deck_revision: Option<u64>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub upload_ids: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SaveDeck {
    pub expected_revision: u64,
    pub deck: Value,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SaveOutline {
    pub expected_revision: u64,
    pub document: Value,
}

pub struct RunLaunch {
    pub run_id: String,
    pub project_id: String,
    pub stage: RunStage,
    pub prompt: String,
    pub instruction: Option<String>,
    pub history: Value,
    pub outline: Option<OutlineSnapshot>,
    pub schema_deck: Option<SessionSchemaDeck>,
}

pub struct Mutation {
    pub snapshot: ProjectSnapshot,
    pub launch: Option<RunLaunch>,
    pub cancelled_run: Option<String>,
}

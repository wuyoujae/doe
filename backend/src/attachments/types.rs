use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UploadPipeline {
    Document,
    Image,
    Audio,
    Video,
}
impl UploadPipeline {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Document => "document",
            Self::Image => "image",
            Self::Audio => "audio",
            Self::Video => "video",
        }
    }
    pub fn max_bytes(self) -> u64 {
        match self {
            Self::Document => 30 * 1024 * 1024,
            Self::Image => 20 * 1024 * 1024,
            Self::Audio => 25 * 1024 * 1024,
            Self::Video => 200 * 1024 * 1024,
        }
    }
}
impl fmt::Display for UploadPipeline {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, thiserror::Error)]
#[error("{message}")]
pub struct Error {
    pub code: String,
    pub message: String,
    pub retryable: bool,
    pub status: u16,
}
pub type UploadError = Error;
impl Error {
    pub fn validation(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            retryable: false,
            status: 400,
        }
    }
    pub fn internal() -> Self {
        Self {
            code: "attachment_storage_unavailable".into(),
            message: "Attachment storage is unavailable. Please retry.".into(),
            retryable: true,
            status: 503,
        }
    }
    pub fn not_found() -> Self {
        Self {
            code: "attachment_not_found".into(),
            message: "The attachment is not available in this project.".into(),
            retryable: false,
            status: 404,
        }
    }
    pub fn conflict(message: &str) -> Self {
        Self {
            code: "attachment_conflict".into(),
            message: message.into(),
            retryable: false,
            status: 409,
        }
    }
}
impl From<rusqlite::Error> for Error {
    fn from(_: rusqlite::Error) -> Self {
        Self::internal()
    }
}
impl From<std::io::Error> for Error {
    fn from(_: std::io::Error) -> Self {
        Self::internal()
    }
}
impl From<serde_json::Error> for Error {
    fn from(_: serde_json::Error) -> Self {
        Self::internal()
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadRecord {
    pub upload_id: String,
    pub client_upload_id: String,
    pub draft_id: String,
    pub project_id: Option<String>,
    pub pipeline: String,
    pub status: String,
    pub original_name: String,
    pub detected_type: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub content_chars: u64,
    pub estimated_tokens: u64,
    pub warnings: Vec<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub created_at: String,
    pub updated_at: String,
    pub error_code: String,
    pub error_message: String,
    pub retryable: bool,
    pub asset_reference: Option<String>,
}
pub type AttachmentSummary = UploadRecord;
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadDocumentResult {
    pub upload_id: String,
    pub file_name: String,
    pub markdown: String,
    pub start_line: usize,
    pub end_line: usize,
    pub total_lines: usize,
    pub truncated: bool,
}
pub struct AttachmentBytes {
    pub bytes: Vec<u8>,
    pub mime: String,
}
pub struct AttachmentContext {
    pub upload: UploadRecord,
    pub markdown: Option<String>,
}

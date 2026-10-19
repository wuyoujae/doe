use serde::{Deserialize, Serialize};

#[derive(Debug, Clone)]
pub struct ParseDocumentRequest {
    pub original_name: String,
    pub declared_mime_type: Option<String>,
    pub bytes: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedDocument {
    pub kind: String,
    pub original_name: String,
    pub detected_type: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub sha256: String,
    pub markdown: String,
    pub content_chars: u64,
    pub estimated_tokens: u64,
    pub warnings: Vec<String>,
    pub duration_ms: u64,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "status", rename_all = "lowercase")]
pub(crate) enum ParserResponse {
    Success { data: ParserDocumentData },
    Error { error: ParserErrorData },
}

#[derive(Debug, Deserialize)]
pub(crate) struct ParserDocumentData {
    pub kind: String,
    pub original_name: String,
    pub detected_type: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub sha256: String,
    pub markdown: String,
    pub content_chars: u64,
    pub estimated_tokens: u64,
    pub warnings: Vec<String>,
    pub duration_ms: u64,
}

#[derive(Debug, Deserialize)]
pub(crate) struct ParserErrorData {
    pub code: String,
    #[allow(dead_code)]
    pub message: String,
    pub retryable: bool,
    pub request_id: Option<String>,
}

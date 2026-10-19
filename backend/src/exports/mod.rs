//! Original DOE export engine, with local durable jobs and immutable source snapshots.
mod repository;
mod worker;

pub use repository::Repository;
use serde::{Deserialize, Serialize};
pub use worker::Service;

pub const RENDERER: &str = "yrkie-doe-schema-v4-server-renderer-v101";
pub const COMPILER: &str = "htmlir-semantic-schema-v4-v6";
pub const WRITER: &str = "pptx2html-source-free-schema-native-fonts-v6";
pub const PDF: &str = "yrkie-doe-schema-pdf-v1";
pub const MAX_OUTPUT: usize = 128 * 1024 * 1024;

#[derive(Clone, Copy, Debug, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    Pdf,
    Pptx,
}
impl Format {
    pub fn extension(self) -> &'static str {
        match self {
            Self::Pdf => "pdf",
            Self::Pptx => "pptx",
        }
    }
    pub fn mime(self) -> &'static str {
        match self {
            Self::Pdf => "application/pdf",
            Self::Pptx => {
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            }
        }
    }
    pub fn valid(self, bytes: &[u8]) -> bool {
        !bytes.is_empty()
            && bytes.len() <= MAX_OUTPUT
            && match self {
                Self::Pdf => {
                    bytes.starts_with(b"%PDF-") && bytes.trim_ascii_end().ends_with(b"%%EOF")
                }
                Self::Pptx => {
                    bytes.starts_with(b"PK\x03\x04")
                        && bytes
                            .windows(4)
                            .rev()
                            .take(65_558)
                            .any(|v| v == b"PK\x05\x06")
                }
            }
    }
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreateExport {
    pub expected_source_revision: u64,
    #[serde(default = "default_fonts")]
    pub embed_fonts: bool,
}
fn default_fonts() -> bool {
    true
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Job {
    pub job_id: String,
    pub project_id: String,
    pub format: Format,
    pub status: String,
    pub source_revision: u64,
    pub file_name: String,
    pub download_url: Option<String>,
    pub error_code: Option<String>,
    pub output_size_bytes: Option<u64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("The export was not found")]
    NotFound,
    #[error("The saved presentation changed; save and retry")]
    Conflict,
    #[error("{0}")]
    Invalid(&'static str),
    #[error("{0}")]
    Runtime(&'static str),
    #[error("Export storage is unavailable")]
    Storage(#[source] Box<dyn std::error::Error + Send + Sync>),
}
impl Error {
    pub fn storage(error: impl Into<Box<dyn std::error::Error + Send + Sync>>) -> Self {
        Self::Storage(error.into())
    }
}
impl From<rusqlite::Error> for Error {
    fn from(error: rusqlite::Error) -> Self {
        Self::storage(error)
    }
}
impl From<serde_json::Error> for Error {
    fn from(error: serde_json::Error) -> Self {
        Self::storage(error)
    }
}
impl From<std::io::Error> for Error {
    fn from(error: std::io::Error) -> Self {
        Self::storage(error)
    }
}

pub(crate) fn digest(bytes: &[u8]) -> String {
    use sha2::{Digest, Sha256};
    format!("{:x}", Sha256::digest(bytes))
}
pub(crate) fn identity(id: &str) -> Result<(), Error> {
    if !id.starts_with("export-") || uuid::Uuid::parse_str(&id[7..]).is_err() {
        return Err(Error::NotFound);
    }
    Ok(())
}

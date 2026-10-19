//! Durable local attachments; no commercial object storage or credentials.
mod document;
mod repository;
mod service;
mod types;
pub mod validation;
pub use repository::{Repository, attach_to_project};
pub use types::{
    AttachmentBytes, AttachmentContext, AttachmentSummary, Error, ReadDocumentResult, UploadRecord,
};
pub const MAX_FILE_BYTES: usize = 30 * 1024 * 1024;
pub const MAX_ATTACHMENTS: usize = 8;

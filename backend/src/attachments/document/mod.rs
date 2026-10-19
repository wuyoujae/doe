//! The original 2026-10-12 document parsing contract and validation.
mod client;
mod error;
mod types;
mod validation;
pub use error::ParseError;
pub use types::{ParseDocumentRequest, ParsedDocument};
pub async fn parse(request: ParseDocumentRequest) -> Result<ParsedDocument, ParseError> {
    client::parse_document_with_client(request).await
}

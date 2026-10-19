use serde_json::Value;
use doe_core::diagnostic::compatibility::{Failure, MAX_DOCUMENT_BYTES};
use doe_core::diagnostic::authoring::{object, text};
#[cfg(test)]
use doe_core::diagnostic::{compatibility::{parse, MAX_REQUEST_BYTES, MAX_ISSUES}, authoring::request_id};
#[path = "outline/mod.rs"]
mod function_outline;
pub use function_outline::outline;



#[cfg(test)]
mod tests;

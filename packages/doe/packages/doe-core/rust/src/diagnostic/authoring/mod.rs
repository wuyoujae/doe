use super::compatibility::Failure;
use serde_json::{Map, Value};
use std::sync::LazyLock;
#[path = "object/mod.rs"]
mod function_object;
pub use function_object::object;



static MARKUP: LazyLock<regex::Regex> = LazyLock::new(|| {
    regex::Regex::new(r"(?i)<(?:/?[a-z][a-z0-9:-]*(?:\s|/|>|$)|!|\?)").unwrap()
});

static ACTIVE_URI: LazyLock<regex::Regex> = LazyLock::new(|| {
    regex::Regex::new(r"(?i)(?:javascript|vbscript|yrkie-asset-data|yrkie-asset)\s*:|file\s*:[/\\]|data\s*:(?:[a-z0-9.+-]+/[a-z0-9.+-]+[;,]|[;,])|/api/(?:assets|uploads|files)/").unwrap()
});
#[path = "text/mod.rs"]
mod function_text;
pub use function_text::text;

#[path = "request-id/mod.rs"]
mod function_request_id;
pub use function_request_id::request_id;


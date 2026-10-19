//! Allowlisted content projection, never a serialization of an Outline object.
use regex::Regex;

use serde_json::Value;

use std::sync::LazyLock;


static REFERENCES: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)([a-z][a-z0-9+.-]*://[^\s<>]+|[a-z]:\\[^\s]+|/api/[^\s]+|\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b|\b[0-9a-f]{32,64}\b|\byrk_plugin_[a-z0-9]+)").unwrap()
});
#[path = "redact-text/mod.rs"]
mod function_redact_text;
pub(crate) use function_redact_text::redact_text;

#[path = "safe-text/mod.rs"]
mod function_safe_text;
pub use function_safe_text::safe_text;

#[path = "safe-title/mod.rs"]
mod function_safe_title;
pub use function_safe_title::safe_title;

#[path = "page-count/mod.rs"]
mod function_page_count;
pub use function_page_count::page_count;

#[path = "render/mod.rs"]
mod function_render;
pub use function_render::render;

#[path = "scalar/mod.rs"]
mod function_scalar;
 use function_scalar::scalar;

#[path = "body-text/mod.rs"]
mod function_body_text;
 use function_body_text::body_text;

#[path = "readable/mod.rs"]
mod function_readable;
 use function_readable::readable;

#[path = "table/mod.rs"]
mod function_table;
 use function_table::table;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;


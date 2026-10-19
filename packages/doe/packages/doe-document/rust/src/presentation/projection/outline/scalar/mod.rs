// Origin: app/backend/core/src/plugin_outline_markdown.rs::scalar
use super::*;


pub(super) fn scalar(value: &Value, ids: &[&str]) -> Option<String> {
    match value {
        Value::String(s) => Some(safe_text(s, ids)),
        Value::Number(n) => Some(n.to_string()),
        Value::Bool(b) => Some(b.to_string()),
        _ => None,
    }
}

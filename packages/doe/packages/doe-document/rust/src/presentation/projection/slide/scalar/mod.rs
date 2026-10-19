// Origin: app/backend/core/src/plugin_slide_markdown.rs::scalar
use super::*;


pub(super) fn scalar(value: &Value) -> Result<String, String> {
    match value {
        Value::String(s) => Ok(s.clone()),
        Value::Number(n) => Ok(n.to_string()),
        _ => Err(UNAVAILABLE.into()),
    }
}

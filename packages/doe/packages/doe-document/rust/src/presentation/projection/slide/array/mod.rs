// Origin: app/backend/core/src/plugin_slide_markdown.rs::array
use super::*;


pub(super) fn array(value: &Value) -> Result<&Vec<Value>, String> {
    value.as_array().ok_or_else(|| UNAVAILABLE.into())
}

// Origin: app/backend/core/src/slide_recovery/grounding.rs::number_value
use super::*;


pub(super) fn number_value(value: &Value) -> Option<String> {
    match value {
        Value::Number(value) => Some(value.to_string()),
        Value::String(value) => number_tokens(value).into_iter().next(),
        _ => None,
    }
}

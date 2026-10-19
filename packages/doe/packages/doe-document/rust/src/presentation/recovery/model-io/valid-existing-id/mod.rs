// Origin: app/backend/core/src/slide_recovery/model_io.rs::valid_existing_id
use super::*;


pub(super) fn valid_existing_id(value: &Value, key: &str) -> Option<String> {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|value| {
            !value.trim().is_empty()
                && value.chars().count() <= 128
                && !value.chars().any(char::is_control)
        })
        .map(str::to_string)
}

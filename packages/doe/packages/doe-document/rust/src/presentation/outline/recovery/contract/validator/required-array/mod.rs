// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::required_array
use super::*;


pub(super) fn required_array<'a>(
    object: &'a Map<String, Value>,
    key: &str,
    field: &str,
) -> Result<&'a Vec<Value>, String> {
    object
        .get(key)
        .and_then(Value::as_array)
        .ok_or_else(|| format!("{field}.{key} must be an array."))
}

// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::required_string
use super::*;


pub(super) fn required_string<'a>(
    object: &'a Map<String, Value>,
    key: &str,
    field: &str,
) -> Result<&'a str, String> {
    object
        .get(key)
        .and_then(Value::as_str)
        .ok_or_else(|| format!("{field}.{key} must be a string."))
}

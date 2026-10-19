// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::validate_required_strings
use super::*;


pub(super) fn validate_required_strings(
    object: &Map<String, Value>,
    keys: &[&str],
    field: &str,
) -> Result<(), String> {
    for key in keys {
        validate_non_empty_string(
            required_string(object, key, field)?,
            &format!("{field}.{key}"),
        )?;
    }
    Ok(())
}

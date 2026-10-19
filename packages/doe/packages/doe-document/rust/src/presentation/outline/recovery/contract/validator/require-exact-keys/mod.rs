// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::require_exact_keys
use super::*;


pub(super) fn require_exact_keys(
    object: &Map<String, Value>,
    allowed: &[&str],
    field: &str,
) -> Result<(), String> {
    require_allowed_keys(object, allowed, field)?;
    for key in allowed {
        if !object.contains_key(*key) {
            return Err(format!("{field}.{key} is required."));
        }
    }
    Ok(())
}

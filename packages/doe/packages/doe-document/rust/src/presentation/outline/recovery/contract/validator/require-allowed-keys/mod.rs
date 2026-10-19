// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::require_allowed_keys
use super::*;


pub(super) fn require_allowed_keys(
    object: &Map<String, Value>,
    allowed: &[&str],
    field: &str,
) -> Result<(), String> {
    if let Some(key) = object.keys().find(|key| !allowed.contains(&key.as_str())) {
        return Err(format!("{field}.{key} is not allowed for this component."));
    }
    Ok(())
}

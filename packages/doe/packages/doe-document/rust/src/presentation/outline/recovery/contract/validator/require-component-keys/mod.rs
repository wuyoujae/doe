// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::require_component_keys
use super::*;


pub(super) fn require_component_keys(
    object: &Map<String, Value>,
    contract: &ComponentContract,
    field: &str,
) -> Result<(), String> {
    if let Some(key) = object.keys().find(|key| {
        !contract.required_fields.contains(&key.as_str())
            && !contract.optional_fields.contains(&key.as_str())
    }) {
        return Err(format!("{field}.{key} is not allowed for this component."));
    }
    for key in contract.required_fields {
        if !object.contains_key(*key) {
            return Err(format!("{field}.{key} is required."));
        }
    }
    Ok(())
}

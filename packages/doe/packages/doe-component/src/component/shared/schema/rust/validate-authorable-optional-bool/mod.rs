// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_optional_bool
use crate::schema::*;


pub fn validate_authorable_optional_bool(
    object: &Map<String, Value>,
    key: &str,
    path: &str,
) -> Result<(), String> {
    if object.get(key).is_some_and(|value| !value.is_boolean()) {
        return mismatch(format!("{path}.{key} must be a boolean"));
    }
    Ok(())
}

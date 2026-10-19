// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_optional_string_array
use crate::schema::*;


pub fn validate_authorable_optional_string_array(
    object: &Map<String, Value>,
    key: &str,
    path: &str,
) -> Result<(), String> {
    if let Some(value) = object.get(key) {
        validate_authorable_string_array(value, &format!("{path}.{key}"))?;
    }
    Ok(())
}

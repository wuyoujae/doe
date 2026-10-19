// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_optional_number
use crate::schema::*;


pub fn validate_authorable_optional_number(
    object: &Map<String, Value>,
    key: &str,
    path: &str,
) -> Result<(), String> {
    if let Some(value) = object.get(key) {
        finite_number(value, &format!("{path}.{key}"))?;
    }
    Ok(())
}

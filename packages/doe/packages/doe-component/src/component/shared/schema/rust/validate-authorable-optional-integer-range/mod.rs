// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_optional_integer_range
use crate::schema::*;


pub fn validate_authorable_optional_integer_range(
    object: &Map<String, Value>,
    key: &str,
    path: &str,
    minimum: i64,
    maximum: i64,
) -> Result<(), String> {
    if let Some(value) = object.get(key) {
        validate_authorable_integer_range(value, &format!("{path}.{key}"), minimum, maximum)?;
    }
    Ok(())
}

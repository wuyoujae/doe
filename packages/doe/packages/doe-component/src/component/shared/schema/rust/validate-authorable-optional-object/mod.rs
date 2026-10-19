// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_optional_object
use crate::schema::*;


pub fn validate_authorable_optional_object(
    parent: &Map<String, Value>,
    key: &str,
    path: &str,
    keys: &[&str],
) -> Result<(), String> {
    let Some(value) = parent.get(key) else {
        return Ok(());
    };
    let object_path = format!("{path}.{key}");
    allowed_keys(object(value, &object_path)?, keys, &object_path)
}

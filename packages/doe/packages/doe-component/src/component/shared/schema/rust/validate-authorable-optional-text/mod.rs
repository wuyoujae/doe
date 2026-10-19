// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_optional_text
use crate::schema::*;


pub fn validate_authorable_optional_text(
    object: &Map<String, Value>,
    key: &str,
    path: &str,
) -> Result<(), String> {
    if let Some(value) = object.get(key) {
        nonempty_text(value, &format!("{path}.{key}"))?;
    }
    Ok(())
}

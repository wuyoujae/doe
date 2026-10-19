// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_string_or_string_array
use crate::schema::*;


pub fn validate_authorable_string_or_string_array(value: &Value, path: &str) -> Result<(), String> {
    if value.is_string() {
        nonempty_text(value, path)?;
        return Ok(());
    }
    validate_authorable_string_array(value, path)
}

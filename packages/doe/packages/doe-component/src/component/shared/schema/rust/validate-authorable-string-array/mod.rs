// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_string_array
use crate::schema::*;


pub fn validate_authorable_string_array(value: &Value, path: &str) -> Result<(), String> {
    for (index, item) in array(value, path)?.iter().enumerate() {
        nonempty_text(item, &format!("{path}[{index}]"))?;
    }
    Ok(())
}

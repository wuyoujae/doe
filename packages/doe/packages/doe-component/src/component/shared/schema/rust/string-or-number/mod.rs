// Origin: app/backend/core/src/slide_agent_output_contract.rs::string_or_number
use crate::schema::*;


pub fn string_or_number(value: &Value, path: &str) -> Result<(), String> {
    if value.is_number() || value.as_str().is_some_and(|value| !value.trim().is_empty()) {
        Ok(())
    } else {
        mismatch(format!("{path} must be a string or number"))
    }
}

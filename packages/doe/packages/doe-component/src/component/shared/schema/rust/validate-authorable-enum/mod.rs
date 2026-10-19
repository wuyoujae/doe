// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_enum
use crate::schema::*;


pub fn validate_authorable_enum(value: &Value, path: &str, allowed: &[&str]) -> Result<(), String> {
    let Some(value) = value.as_str() else {
        return mismatch(format!("{path} must be a string enum"));
    };
    if !allowed.contains(&value) {
        return mismatch(format!("{path} must equal one of {}", allowed.join(", ")));
    }
    Ok(())
}

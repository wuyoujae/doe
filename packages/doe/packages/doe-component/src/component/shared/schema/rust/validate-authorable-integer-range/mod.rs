// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_integer_range
use crate::schema::*;


pub fn validate_authorable_integer_range(
    value: &Value,
    path: &str,
    minimum: i64,
    maximum: i64,
) -> Result<i64, String> {
    let Some(value) = value.as_i64() else {
        return Err(format!(
            "{SCHEMA_MISMATCH_ERROR}: {path} must be an integer"
        ));
    };
    if !(minimum..=maximum).contains(&value) {
        return Err(format!(
            "{SCHEMA_MISMATCH_ERROR}: {path} must be between {minimum} and {maximum}"
        ));
    }
    Ok(value)
}

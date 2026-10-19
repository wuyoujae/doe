// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_bounded_index
use crate::schema::*;


pub fn validate_bounded_index(value: &Value, path: &str, length: usize) -> Result<(), String> {
    let index = value
        .as_i64()
        .filter(|index| *index >= 0)
        .ok_or_else(|| format!("{SCHEMA_MISMATCH_ERROR}: {path} must be a non-negative integer"))?;
    if usize::try_from(index)
        .ok()
        .is_none_or(|index| index >= length)
    {
        return mismatch(format!("{path} must reference an existing item"));
    }
    Ok(())
}

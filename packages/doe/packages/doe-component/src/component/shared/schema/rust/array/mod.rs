// Origin: app/backend/core/src/slide_agent_output_contract.rs::array
use crate::schema::*;


pub fn array<'a>(value: &'a Value, path: &str) -> Result<&'a Vec<Value>, String> {
    value
        .as_array()
        .ok_or_else(|| format!("{SCHEMA_MISMATCH_ERROR}: {path} must be an array"))
}

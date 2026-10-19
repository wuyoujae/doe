// Origin: app/backend/core/src/slide_agent_output_contract.rs::object
use crate::schema::*;


pub fn object<'a>(value: &'a Value, path: &str) -> Result<&'a Map<String, Value>, String> {
    value
        .as_object()
        .ok_or_else(|| format!("{SCHEMA_MISMATCH_ERROR}: {path} must be an object"))
}

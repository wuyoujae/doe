// Origin: app/backend/core/src/slide_agent_output_contract.rs::required
use crate::schema::*;


pub fn required<'a>(
    object: &'a Map<String, Value>,
    key: &str,
    path: &str,
) -> Result<&'a Value, String> {
    object
        .get(key)
        .ok_or_else(|| format!("{SCHEMA_MISMATCH_ERROR}: {path}.{key} is required"))
}

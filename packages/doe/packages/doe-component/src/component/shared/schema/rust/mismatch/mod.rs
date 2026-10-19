// Origin: app/backend/core/src/slide_agent_output_contract.rs::mismatch
use crate::schema::*;


pub fn mismatch(message: impl AsRef<str>) -> Result<(), String> {
    Err(format!("{SCHEMA_MISMATCH_ERROR}: {}", message.as_ref()))
}

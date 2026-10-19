// Origin: app/backend/core/src/slide_agent_output_contract.rs::required_text
use crate::schema::*;


pub fn required_text(object: &Map<String, Value>, key: &str, path: &str) -> Result<(), String> {
    nonempty_text(required(object, key, path)?, &format!("{path}.{key}"))?;
    Ok(())
}

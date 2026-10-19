// Origin: app/backend/core/src/slide_agent_output_contract.rs::allowed_keys
use crate::schema::*;


pub fn allowed_keys(object: &Map<String, Value>, keys: &[&str], path: &str) -> Result<(), String> {
    if let Some(key) = object.keys().find(|key| !keys.contains(&key.as_str())) {
        return mismatch(format!("{path}.{key} is not allowed"));
    }
    Ok(())
}

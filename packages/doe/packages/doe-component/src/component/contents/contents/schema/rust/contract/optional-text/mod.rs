// Origin: app/backend/core/src/slide_agent_output_contract/contents.rs::optional_text
use super::*;


pub(super) fn optional_text(object: &Map<String, Value>, key: &str, path: &str) -> Result<(), String> {
    if object.get(key).is_some_and(|value| !value.is_string()) {
        return mismatch(format!("{path}.{key} must be text"));
    }
    Ok(())
}

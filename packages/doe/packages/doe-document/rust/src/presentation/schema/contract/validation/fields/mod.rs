// Origin: app/backend/core/src/slide_agent_output_contract/validation.rs::fields
use super::*;

// Select only known layout choices for validation; keep the submitted page
// byte-for-value intact, including the editor's automatic geometry and nulls.
pub(super) fn fields(value: &Value, path: &str, keys: &[&str]) -> Result<Value, String> {
    let source = object(value, path)?;
    Ok(Value::Object(
        source
            .iter()
            .filter(|(key, value)| keys.contains(&key.as_str()) && !value.is_null())
            .map(|(key, value)| (key.clone(), value.clone()))
            .collect(),
    ))
}

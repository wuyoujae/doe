// Origin: app/backend/core/src/outline_recovery/compiler/unique.rs::parse_unique_json
use super::*;


pub(in super::super) fn parse_unique_json(source: &str) -> Result<Value, String> {
    let mut deserializer = serde_json::Deserializer::from_str(source);
    let value = UniqueValue::deserialize(&mut deserializer)
        .map_err(|error| format!("strict JSON parse failed: {error}"))?;
    deserializer
        .end()
        .map_err(|error| format!("strict JSON parse found trailing content: {error}"))?;
    Ok(value.0)
}

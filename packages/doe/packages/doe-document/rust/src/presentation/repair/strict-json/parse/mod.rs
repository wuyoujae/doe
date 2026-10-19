// Origin: app/backend/core/src/slide_auto_repair_v2/strict_json.rs::parse
use super::*;


pub(in super::super) fn parse(raw: &str) -> Result<Value, String> {
    let mut deserializer = serde_json::Deserializer::from_str(raw);
    let value = StrictJson::deserialize(&mut deserializer)
        .map_err(|error| error.to_string())?
        .0;
    deserializer.end().map_err(|error| error.to_string())?;
    Ok(value)
}

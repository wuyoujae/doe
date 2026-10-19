// Origin: app/backend/core/src/slide_recovery/duplicate_json.rs::parse
use super::*;


pub fn parse(raw: &str) -> Result<DuplicateAwareJson, String> {
    let mut deserializer = serde_json::Deserializer::from_str(raw);
    let parsed =
        DuplicateAwareJson::deserialize(&mut deserializer).map_err(|error| error.to_string())?;
    deserializer.end().map_err(|error| error.to_string())?;
    Ok(parsed)
}

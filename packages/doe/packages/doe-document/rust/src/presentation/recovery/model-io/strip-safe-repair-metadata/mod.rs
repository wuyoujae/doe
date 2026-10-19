// Origin: app/backend/core/src/slide_recovery/model_io.rs::strip_safe_repair_metadata
use super::*;


pub(super) fn strip_safe_repair_metadata(value: &Value) -> Option<Value> {
    let object = value.as_object()?;
    if !object.contains_key("base_deck_sha256") || !object.contains_key("repairs") {
        return None;
    }
    if object.iter().any(|(key, value)| {
        !matches!(key.as_str(), "base_deck_sha256" | "repairs")
            && !safe_repair_metadata_entry(key, value)
    }) {
        return None;
    }
    let mut normalized = object.clone();
    normalized.retain(|key, _| matches!(key.as_str(), "base_deck_sha256" | "repairs"));
    Some(Value::Object(normalized))
}

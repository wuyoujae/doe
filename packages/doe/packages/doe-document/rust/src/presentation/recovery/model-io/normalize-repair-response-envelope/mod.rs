// Origin: app/backend/core/src/slide_recovery/model_io.rs::normalize_repair_response_envelope
use super::*;


pub(super) fn normalize_repair_response_envelope(value: Value) -> Result<Value, String> {
    const WRAPPER_KEYS: [&str; 4] = ["result", "output", "data", "response"];
    let mut candidates = Vec::new();
    if let Some(candidate) = strip_safe_repair_metadata(&value) {
        candidates.push(candidate);
    }
    if let Some(root) = value.as_object() {
        for wrapper in WRAPPER_KEYS {
            let Some(candidate) = root.get(wrapper) else {
                continue;
            };
            if root.iter().any(|(key, value)| {
                key != wrapper
                    && !WRAPPER_KEYS.contains(&key.as_str())
                    && !safe_repair_metadata_entry(key, value)
            }) {
                continue;
            }
            if let Some(candidate) = strip_safe_repair_metadata(candidate) {
                candidates.push(candidate);
            }
        }
    }
    candidates.sort_by_key(super::super::canonical_value_sha256);
    candidates.dedup();
    match candidates.len() {
        0 => Ok(value),
        1 => Ok(candidates.remove(0)),
        _ => Err("slide_recovery_model_output_ambiguous_wrapper".to_string()),
    }
}

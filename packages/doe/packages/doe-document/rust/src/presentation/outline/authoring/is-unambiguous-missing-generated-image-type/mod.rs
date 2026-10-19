// Origin: app/backend/core/src/outline_agent_output_contract.rs::is_unambiguous_missing_generated_image_type
use super::*;


pub(super) fn is_unambiguous_missing_generated_image_type(image: &Map<String, Value>) -> bool {
    const EXACT_KEYS: [&str; 4] = ["body", "src", "ratio", "role"];
    image.len() == EXACT_KEYS.len()
        && image.keys().all(|key| EXACT_KEYS.contains(&key.as_str()))
        && image.get("body") == Some(&Value::Null)
        && image.get("src").and_then(Value::as_str).is_some_and(|src| {
            crate::presentation::outline::image_placeholder::parse_source(src)
                .ok()
                .flatten()
                .is_some()
        })
        && image
            .get("ratio")
            .and_then(Value::as_str)
            .is_some_and(|ratio| ["16:9", "4:3", "3:4", "1:1", "9:16"].contains(&ratio))
        && image
            .get("role")
            .and_then(Value::as_str)
            .is_some_and(|role| !role.trim().is_empty())
}

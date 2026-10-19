// Origin: app/backend/core/src/outline_agent_output_contract.rs::normalize_generated_image_types
use super::*;


pub(super) fn normalize_generated_image_types(value: &mut Value) -> usize {
    match value {
        Value::Object(object) => {
            let repair_type = object.get("type").and_then(Value::as_str) == Some("image")
                && object
                    .get("src")
                    .and_then(Value::as_str)
                    .is_some_and(|src| src.starts_with("GENRATEIMG("));
            let mut repairs = usize::from(repair_type);
            if repair_type {
                object.insert(
                    "type".to_string(),
                    Value::String("generated_image".to_string()),
                );
            }
            for child in object.values_mut() {
                repairs = repairs.saturating_add(normalize_generated_image_types(child));
            }
            repairs
        }
        Value::Array(values) => values
            .iter_mut()
            .map(normalize_generated_image_types)
            .fold(0usize, usize::saturating_add),
        _ => 0,
    }
}

// Origin: app/backend/core/src/outline_agent_output_contract.rs::normalize_missing_generated_image_types
use super::*;


pub(super) fn normalize_missing_generated_image_types(value: &mut Value) -> usize {
    match value {
        Value::Object(object) => {
            let mut repairs = 0usize;
            if object.get("type").and_then(Value::as_str) == Some("illustrated_items") {
                if let Some(items) = object.get_mut("items").and_then(Value::as_array_mut) {
                    for item in items {
                        let Some(image) = item
                            .as_object_mut()
                            .and_then(|item| item.get_mut("image"))
                            .and_then(Value::as_object_mut)
                        else {
                            continue;
                        };
                        if is_unambiguous_missing_generated_image_type(image) {
                            image.remove("body");
                            image.insert(
                                "type".to_string(),
                                Value::String("generated_image".to_string()),
                            );
                            repairs = repairs.saturating_add(1);
                        }
                    }
                }
            }
            object.values_mut().fold(repairs, |count, child| {
                count.saturating_add(normalize_missing_generated_image_types(child))
            })
        }
        Value::Array(values) => values.iter_mut().fold(0usize, |count, child| {
            count.saturating_add(normalize_missing_generated_image_types(child))
        }),
        _ => 0,
    }
}

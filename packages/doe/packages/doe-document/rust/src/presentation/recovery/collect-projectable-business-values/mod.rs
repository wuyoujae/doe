// Origin: app/backend/core/src/slide_recovery/mod.rs::collect_projectable_business_values
use super::*;


pub(super) fn collect_projectable_business_values(value: &Value, key: Option<&str>, output: &mut Vec<String>) {
    if key.is_some_and(|key| {
        matches!(
            key,
            "icon"
                | "color"
                | "fill"
                | "stroke"
                | "strokeWidth"
                | "opacity"
                | "side"
                | "position"
                | "layout"
                | "style"
        )
    }) {
        return;
    }
    match value {
        Value::String(value) => {
            let value = value.trim();
            if !value.is_empty() {
                output.push(value.to_string());
            }
        }
        Value::Number(value) => output.push(value.to_string()),
        Value::Array(values) => {
            for value in values {
                collect_projectable_business_values(value, key, output);
            }
        }
        Value::Object(values) => {
            for (key, value) in values {
                collect_projectable_business_values(value, Some(key), output);
            }
        }
        Value::Null | Value::Bool(_) => {}
    }
}

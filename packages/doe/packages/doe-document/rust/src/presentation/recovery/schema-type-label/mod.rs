// Origin: app/backend/core/src/slide_recovery/mod.rs::schema_type_label
use super::*;


pub(super) fn schema_type_label(schema: &Value) -> String {
    match schema.get("type") {
        Some(Value::String(kind)) => kind.clone(),
        Some(Value::Array(kinds)) => kinds
            .iter()
            .filter_map(Value::as_str)
            .collect::<Vec<_>>()
            .join("|"),
        _ if schema.get("properties").is_some() => "object".to_string(),
        _ if schema.get("items").is_some() => "array".to_string(),
        _ => "contract value".to_string(),
    }
}

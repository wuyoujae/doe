// Origin: app/backend/core/src/slide_recovery/mod.rs::schema_expects_container
use super::*;


pub(super) fn schema_expects_container(schema: &Value) -> bool {
    if let Some(branch) = select_schema_branch(schema, &Value::Object(Map::new())) {
        return schema_expects_container(branch);
    }
    match schema.get("type") {
        Some(Value::String(kind)) => matches!(kind.as_str(), "object" | "array"),
        Some(Value::Array(kinds)) => kinds
            .iter()
            .filter_map(Value::as_str)
            .any(|kind| matches!(kind, "object" | "array")),
        _ => schema.get("properties").is_some() || schema.get("items").is_some(),
    }
}

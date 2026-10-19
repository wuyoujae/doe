// Origin: app/backend/core/src/slide_recovery/mod.rs::schema_type_matches
use super::*;


pub(super) fn schema_type_matches(schema: &Value, value: &Value) -> bool {
    if let Some(branches) = schema.get("anyOf").and_then(Value::as_array) {
        return branches
            .iter()
            .any(|branch| schema_type_matches(branch, value));
    }
    let matches_type = |kind: &str| match kind {
        "object" => value.is_object(),
        "array" => value.is_array(),
        "string" => value.is_string(),
        "integer" => value.as_i64().is_some() || value.as_u64().is_some(),
        "number" => value.is_number(),
        "boolean" => value.is_boolean(),
        "null" => value.is_null(),
        _ => false,
    };
    match schema.get("type") {
        Some(Value::String(kind)) => matches_type(kind),
        Some(Value::Array(kinds)) => kinds.iter().filter_map(Value::as_str).any(matches_type),
        None => true,
        _ => false,
    }
}

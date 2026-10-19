// Origin: app/backend/core/src/slide_recovery/tests.rs::break_first_bounded_array
use super::*;


pub(super) fn break_first_bounded_array(value: &mut Value, schema: &Value) -> bool {
    if schema.get("type").and_then(Value::as_str) == Some("array")
        && schema.get("minItems").and_then(Value::as_u64).unwrap_or(0) > 0
    {
        *value = Value::Array(Vec::new());
        return true;
    }
    if let (Some(object), Some(properties)) = (
        value.as_object_mut(),
        schema.get("properties").and_then(Value::as_object),
    ) {
        for (key, item_schema) in properties {
            if let Some(item) = object.get_mut(key) {
                if break_first_bounded_array(item, item_schema) {
                    return true;
                }
            }
        }
    }
    false
}

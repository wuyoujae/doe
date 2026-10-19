// Origin: app/backend/core/src/slide_recovery/mod.rs::schema_enum_matches
use super::*;


pub(super) fn schema_enum_matches(schema: &Value, value: &Value) -> bool {
    schema
        .get("enum")
        .and_then(Value::as_array)
        .is_none_or(|allowed| allowed.contains(value))
}

// Origin: app/backend/core/src/slide_recovery/mod.rs::canonicalize_value
use super::*;


pub(super) fn canonicalize_value(value: &Value) -> Value {
    match value {
        Value::Array(items) => Value::Array(items.iter().map(canonicalize_value).collect()),
        Value::Object(object) => {
            let mut keys = object.keys().collect::<Vec<_>>();
            keys.sort();
            let mut canonical = Map::new();
            for key in keys {
                canonical.insert(key.clone(), canonicalize_value(&object[key]));
            }
            Value::Object(canonical)
        }
        _ => value.clone(),
    }
}

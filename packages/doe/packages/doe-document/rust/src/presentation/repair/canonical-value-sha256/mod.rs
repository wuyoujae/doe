// Origin: app/backend/core/src/slide_auto_repair_v2/mod.rs::canonical_value_sha256
use super::*;


pub fn canonical_value_sha256(value: &Value) -> String {
    fn canonicalize(value: &Value) -> Value {
        match value {
            Value::Array(items) => Value::Array(items.iter().map(canonicalize).collect()),
            Value::Object(object) => {
                let mut keys = object.keys().collect::<Vec<_>>();
                keys.sort();
                let mut canonical = Map::new();
                for key in keys {
                    canonical.insert(key.clone(), canonicalize(&object[key]));
                }
                Value::Object(canonical)
            }
            _ => value.clone(),
        }
    }

    let canonical = canonicalize(value);
    sha256_hex(&serde_json::to_vec(&canonical).expect("JSON Value serialization cannot fail"))
}

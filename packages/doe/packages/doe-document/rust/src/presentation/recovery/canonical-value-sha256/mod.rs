// Origin: app/backend/core/src/slide_recovery/mod.rs::canonical_value_sha256
use super::*;


pub fn canonical_value_sha256(value: &Value) -> String {
    let canonical = canonicalize_value(value);
    let bytes = serde_json::to_vec(&canonical).expect("JSON Value serialization cannot fail");
    sha256_hex(&bytes)
}

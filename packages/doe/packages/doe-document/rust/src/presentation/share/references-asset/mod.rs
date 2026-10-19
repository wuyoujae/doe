// Origin: app/backend/core/src/presentation_shares.rs::references_asset
use super::*;


pub fn references_asset(value: &Value, id: &str) -> bool {
    match value {
        Value::String(s) => s == &format!("yrkie-asset-data://{id}"),
        Value::Array(items) => items.iter().any(|v| references_asset(v, id)),
        Value::Object(fields) => fields.values().any(|v| references_asset(v, id)),
        _ => false,
    }
}

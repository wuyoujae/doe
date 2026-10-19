// Origin: app/backend/core/src/slide_recovery/model_io.rs::safe_repair_metadata_entry
use super::*;


pub(super) fn safe_repair_metadata_entry(key: &str, value: &Value) -> bool {
    matches!(
        key,
        "status" | "contract" | "schema_version" | "version" | "kind"
    ) && matches!(
        value,
        Value::Null | Value::Bool(_) | Value::Number(_) | Value::String(_)
    )
}

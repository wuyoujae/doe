// Origin: app/backend/core/src/slide_recovery/mod.rs::repair_root_controls
use super::*;


pub(super) fn repair_root_controls(candidate: &mut Value, edits: &mut Vec<SlideRepairEdit>) {
    let Some(root) = candidate.as_object_mut() else {
        return;
    };
    if root.get("version").and_then(Value::as_i64) != Some(4)
        && root.get("deck").and_then(Value::as_object).is_some()
    {
        let before = root.get("version").cloned().unwrap_or(Value::Null);
        root.insert("version".to_string(), Value::from(4));
        record_edit(
            edits,
            "contract.fixed_value",
            "root.version",
            "replace_with_contract_version",
            None,
            &before,
            &Value::from(4),
            "schema-v4 Agent output has exactly one legal version",
        );
    }
}

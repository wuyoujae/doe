// Origin: app/backend/core/src/outline_agent_output_contract.rs::semantic_edit
use super::*;


pub(super) fn semantic_edit(
    operation: &str,
    target_pointer: &str,
    before: &Value,
    after: &Value,
    constraint_id: &str,
) -> RepairEdit {
    let encode = |value: &Value| serde_json::to_vec(value).unwrap_or_default();
    RepairEdit {
        operation: operation.to_string(),
        source_byte_start: 0,
        source_byte_end: 0,
        token: None,
        target_pointer: target_pointer.to_string(),
        before_hash: outline_recovery::diagnostics::sha256_hex(&encode(before)),
        after_hash: outline_recovery::diagnostics::sha256_hex(&encode(after)),
        constraint_id: constraint_id.to_string(),
        ambiguity: Ambiguity::A2,
    }
}

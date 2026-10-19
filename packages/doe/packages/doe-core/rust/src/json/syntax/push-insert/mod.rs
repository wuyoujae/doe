// Origin: app/backend/core/src/json_syntax_repair.rs::push_insert
use super::*;


pub(super) fn push_insert(
    state: &RepairState,
    neighbors: &mut Vec<RepairState>,
    position: usize,
    inserted: &str,
    kind: JsonSyntaxRepairKind,
) {
    if !state.text.is_char_boundary(position) {
        return;
    }
    let mut text = String::with_capacity(state.text.len() + inserted.len());
    text.push_str(&state.text[..position]);
    text.push_str(inserted);
    text.push_str(&state.text[position..]);
    let mut edits = state.edits.clone();
    edits.push(JsonSyntaxRepairEdit {
        kind,
        byte_offset: position,
        scope: "value".to_string(),
    });
    neighbors.push(RepairState { text, edits });
}

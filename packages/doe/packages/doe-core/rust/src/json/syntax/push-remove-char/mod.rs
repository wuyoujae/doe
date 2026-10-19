// Origin: app/backend/core/src/json_syntax_repair.rs::push_remove_char
use super::*;


pub(super) fn push_remove_char(
    state: &RepairState,
    neighbors: &mut Vec<RepairState>,
    position: usize,
    kind: JsonSyntaxRepairKind,
) {
    let Some(character) = char_at(&state.text, position) else {
        return;
    };
    let end = position + character.len_utf8();
    let mut text = String::with_capacity(state.text.len() - character.len_utf8());
    text.push_str(&state.text[..position]);
    text.push_str(&state.text[end..]);
    let mut edits = state.edits.clone();
    edits.push(JsonSyntaxRepairEdit {
        kind,
        byte_offset: position,
        scope: "value".to_string(),
    });
    neighbors.push(RepairState { text, edits });
}

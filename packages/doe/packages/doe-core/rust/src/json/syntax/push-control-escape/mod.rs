// Origin: app/backend/core/src/json_syntax_repair.rs::push_control_escape
use super::*;


pub(super) fn push_control_escape(
    state: &RepairState,
    neighbors: &mut Vec<RepairState>,
    position: usize,
    character: char,
) {
    let replacement = match character {
        '\n' => "\\n".to_string(),
        '\r' => "\\r".to_string(),
        '\t' => "\\t".to_string(),
        '\u{08}' => "\\b".to_string(),
        '\u{0c}' => "\\f".to_string(),
        _ => format!("\\u{:04x}", character as u32),
    };
    let end = position + character.len_utf8();
    let mut text = String::with_capacity(state.text.len() + replacement.len());
    text.push_str(&state.text[..position]);
    text.push_str(&replacement);
    text.push_str(&state.text[end..]);
    let mut edits = state.edits.clone();
    edits.push(JsonSyntaxRepairEdit {
        kind: JsonSyntaxRepairKind::EscapeStringControlCharacter,
        byte_offset: position,
        scope: "value".to_string(),
    });
    neighbors.push(RepairState { text, edits });
}

// Origin: app/backend/core/src/json_syntax_repair.rs::push_quoted_bare_token
use super::*;


pub(super) fn push_quoted_bare_token(state: &RepairState, neighbors: &mut Vec<RepairState>, position: usize) {
    let Some(character) = char_at(&state.text, position) else {
        return;
    };
    if !is_bare_token_character(character) || lexical_state_at(&state.text, position).in_string {
        return;
    }
    let mut start = position;
    for (offset, candidate) in state.text[..position].char_indices().rev() {
        if !is_bare_token_character(candidate) {
            break;
        }
        start = offset;
    }
    let mut end = position + character.len_utf8();
    let remainder_start = end;
    for (offset, candidate) in state.text[remainder_start..].char_indices() {
        if !is_bare_token_character(candidate) {
            break;
        }
        end = remainder_start + offset + candidate.len_utf8();
    }
    let token = &state.text[start..end];
    if token.is_empty()
        || matches!(token, "true" | "false" | "null")
        || token.parse::<f64>().is_ok()
    {
        return;
    }
    let previous = previous_non_whitespace(&state.text, start);
    let next = next_non_whitespace(&state.text, end);
    if next == Some('"') && previous.is_some_and(|ch| matches!(ch, '{' | ',' | ':' | '[')) {
        push_insert(
            state,
            neighbors,
            start,
            "\"",
            JsonSyntaxRepairKind::InsertMissingStringQuote,
        );
    }
    let key_position = next == Some(':') && previous.is_some_and(|ch| matches!(ch, '{' | ','));
    let value_position = previous.is_some_and(|ch| matches!(ch, ':' | '[' | ','))
        && next.is_some_and(|ch| matches!(ch, ',' | '}' | ']'));
    if !key_position && !value_position {
        return;
    }
    let mut text = String::with_capacity(state.text.len() + 2);
    text.push_str(&state.text[..start]);
    text.push('"');
    text.push_str(token);
    text.push('"');
    text.push_str(&state.text[end..]);
    let mut edits = state.edits.clone();
    edits.push(JsonSyntaxRepairEdit {
        kind: JsonSyntaxRepairKind::QuoteBareToken,
        byte_offset: start,
        scope: "value".to_string(),
    });
    edits.push(JsonSyntaxRepairEdit {
        kind: JsonSyntaxRepairKind::QuoteBareToken,
        byte_offset: end,
        scope: "value".to_string(),
    });
    neighbors.push(RepairState { text, edits });
}

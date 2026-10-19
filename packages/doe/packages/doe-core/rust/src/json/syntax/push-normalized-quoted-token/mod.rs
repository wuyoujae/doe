// Origin: app/backend/core/src/json_syntax_repair.rs::push_normalized_quoted_token
use super::*;


pub(super) fn push_normalized_quoted_token(
    state: &RepairState,
    neighbors: &mut Vec<RepairState>,
    position: usize,
) {
    let Some(opening) = char_at(&state.text, position) else {
        return;
    };
    let closing = match opening {
        '\'' => '\'',
        '‘' => '’',
        '“' => '”',
        _ => return,
    };
    if lexical_state_at(&state.text, position).in_string {
        return;
    }
    let content_start = position + opening.len_utf8();
    let Some(relative_end) = state.text[content_start..].find(closing) else {
        return;
    };
    let content_end = content_start + relative_end;
    let end = content_end + closing.len_utf8();
    let content = &state.text[content_start..content_end];
    let escaped_content = content.replace('"', "\\\"");
    let mut text = String::with_capacity(state.text.len() + escaped_content.len());
    text.push_str(&state.text[..position]);
    text.push('"');
    text.push_str(&escaped_content);
    text.push('"');
    text.push_str(&state.text[end..]);
    let mut edits = state.edits.clone();
    edits.push(JsonSyntaxRepairEdit {
        kind: JsonSyntaxRepairKind::NormalizeQuotedToken,
        byte_offset: position,
        scope: "value".to_string(),
    });
    edits.push(JsonSyntaxRepairEdit {
        kind: JsonSyntaxRepairKind::NormalizeQuotedToken,
        byte_offset: content_end,
        scope: "value".to_string(),
    });
    neighbors.push(RepairState { text, edits });
}

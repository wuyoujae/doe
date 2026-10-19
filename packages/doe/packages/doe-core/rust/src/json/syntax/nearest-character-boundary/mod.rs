// Origin: app/backend/core/src/json_syntax_repair.rs::nearest_character_boundary


pub(super) fn nearest_character_boundary(text: &str, offset: usize) -> usize {
    let offset = offset.min(text.len());
    if text.is_char_boundary(offset) {
        return offset;
    }

    let mut before = offset;
    while before > 0 && !text.is_char_boundary(before) {
        before -= 1;
    }
    let mut after = offset;
    while after < text.len() && !text.is_char_boundary(after) {
        after += 1;
    }
    if offset.abs_diff(before) < after.abs_diff(offset) {
        before
    } else {
        after
    }
}

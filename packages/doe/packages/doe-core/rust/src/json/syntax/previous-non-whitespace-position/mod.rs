// Origin: app/backend/core/src/json_syntax_repair.rs::previous_non_whitespace_position


pub(super) fn previous_non_whitespace_position(text: &str, position: usize) -> Option<usize> {
    text[..position.min(text.len())]
        .char_indices()
        .rev()
        .find(|(_, character)| !character.is_whitespace())
        .map(|(offset, _)| offset)
}

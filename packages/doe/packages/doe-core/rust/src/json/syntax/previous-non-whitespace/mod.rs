// Origin: app/backend/core/src/json_syntax_repair.rs::previous_non_whitespace


pub(super) fn previous_non_whitespace(text: &str, position: usize) -> Option<char> {
    text[..position.min(text.len())]
        .chars()
        .rev()
        .find(|character| !character.is_whitespace())
}

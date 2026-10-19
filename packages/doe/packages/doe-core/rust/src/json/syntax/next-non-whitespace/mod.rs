// Origin: app/backend/core/src/json_syntax_repair.rs::next_non_whitespace


pub(super) fn next_non_whitespace(text: &str, position: usize) -> Option<char> {
    text[position.min(text.len())..]
        .chars()
        .find(|character| !character.is_whitespace())
}

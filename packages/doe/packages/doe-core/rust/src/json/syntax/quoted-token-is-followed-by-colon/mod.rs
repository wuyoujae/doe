// Origin: app/backend/core/src/json_syntax_repair.rs::quoted_token_is_followed_by_colon
use super::*;


pub(super) fn quoted_token_is_followed_by_colon(text: &str, position: usize) -> bool {
    if char_at(text, position) != Some('"') {
        return false;
    }
    let mut escaped = false;
    for (relative, character) in text[position + 1..].char_indices() {
        if escaped {
            escaped = false;
        } else if character == '\\' {
            escaped = true;
        } else if character == '"' {
            let end = position + 1 + relative + 1;
            return next_non_whitespace(text, end) == Some(':');
        }
    }
    false
}

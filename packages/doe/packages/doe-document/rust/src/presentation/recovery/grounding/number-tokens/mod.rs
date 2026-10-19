// Origin: app/backend/core/src/slide_recovery/grounding.rs::number_tokens
use super::*;


pub(super) fn number_tokens(value: &str) -> BTreeSet<String> {
    let mut output = BTreeSet::new();
    let mut token = String::new();
    for character in value.chars().chain(std::iter::once(' ')) {
        if character.is_ascii_digit() || matches!(character, '.' | ',' | '%' | '+' | '-') {
            token.push(character);
        } else if !token.is_empty() {
            if token.chars().any(|value| value.is_ascii_digit()) {
                output.insert(canonical_number_token(&token));
            }
            token.clear();
        }
    }
    output
}

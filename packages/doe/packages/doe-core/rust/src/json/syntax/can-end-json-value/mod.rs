// Origin: app/backend/core/src/json_syntax_repair.rs::can_end_json_value


pub(super) fn can_end_json_value(character: char) -> bool {
    character == '"'
        || matches!(character, '}' | ']')
        || character.is_ascii_digit()
        || matches!(character, 'e' | 'l')
}

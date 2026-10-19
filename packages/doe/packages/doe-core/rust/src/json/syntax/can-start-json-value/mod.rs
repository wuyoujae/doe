// Origin: app/backend/core/src/json_syntax_repair.rs::can_start_json_value
use super::*;


pub(super) fn can_start_json_value(character: char) -> bool {
    character == '"'
        || matches!(character, '{' | '[' | '-' | '\'' | '‘' | '“')
        || character.is_ascii_digit()
        || matches!(character, 't' | 'f' | 'n')
        || is_bare_token_character(character)
}

// Origin: app/backend/core/src/json_syntax_repair.rs::is_bare_token_character


pub(super) fn is_bare_token_character(character: char) -> bool {
    !character.is_whitespace()
        && !matches!(
            character,
            '{' | '}' | '[' | ']' | ',' | ':' | '"' | '\'' | '‘' | '’' | '“' | '”'
        )
}

// Origin: app/backend/core/src/json_syntax_repair.rs::matching_closer


pub(super) fn matching_closer(opening: char) -> char {
    match opening {
        '{' => '}',
        '[' => ']',
        _ => unreachable!("JSON stack stores only opening delimiters"),
    }
}

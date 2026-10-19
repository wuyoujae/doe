// Origin: app/backend/core/src/json_syntax_repair.rs::char_at


pub(super) fn char_at(text: &str, position: usize) -> Option<char> {
    text.get(position..)?.chars().next()
}

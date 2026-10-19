// Origin: app/backend/core/src/json_syntax_repair.rs::lexical_state_at
use super::*;


pub(super) fn lexical_state_at(text: &str, position: usize) -> LexicalState {
    let mut state = LexicalState::default();
    for (_, character) in text[..position.min(text.len())].char_indices() {
        if state.in_string {
            if state.escaped {
                state.escaped = false;
            } else if character == '\\' {
                state.escaped = true;
            } else if character == '"' {
                state.in_string = false;
            }
            continue;
        }
        match character {
            '"' => state.in_string = true,
            '{' | '[' => state.stack.push(character),
            '}' => {
                if state.stack.last() == Some(&'{') {
                    state.stack.pop();
                }
            }
            ']' => {
                if state.stack.last() == Some(&'[') {
                    state.stack.pop();
                }
            }
            _ => {}
        }
    }
    state
}

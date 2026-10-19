// Origin: app/backend/core/src/json_syntax_repair.rs::error_byte_offset
use super::*;


pub(super) fn error_byte_offset(text: &str, error: &serde_json::Error) -> usize {
    let target_line = error.line().max(1);
    let mut line = 1usize;
    let mut line_start = 0usize;
    for (offset, character) in text.char_indices() {
        if line == target_line {
            break;
        }
        if character == '\n' {
            line += 1;
            line_start = offset + 1;
        }
    }
    let estimated = line_start.saturating_add(error.column().saturating_sub(1));
    nearest_character_boundary(text, estimated.min(text.len()))
}

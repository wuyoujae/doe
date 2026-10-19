// Origin: app/backend/core/src/outline_recovery/compiler/invariant.rs::collect_decoded_strings_tolerantly
use super::*;


pub(super) fn collect_decoded_strings_tolerantly(source: &str) -> Vec<String> {
    let bytes = source.as_bytes();
    let mut values = Vec::new();
    let mut cursor = 0usize;
    let mut container_stack = Vec::<u8>::new();
    while cursor < bytes.len() {
        if bytes[cursor] != b'"' {
            match bytes[cursor] {
                b'{' => container_stack.push(b'}'),
                b'[' => container_stack.push(b']'),
                b'}' | b']' if container_stack.last() == Some(&bytes[cursor]) => {
                    container_stack.pop();
                }
                _ => {}
            }
            cursor += 1;
            continue;
        }
        let start = cursor;
        cursor += 1;
        let mut escaped = false;
        let mut closed = false;
        while cursor < bytes.len() {
            let byte = bytes[cursor];
            cursor += 1;
            if escaped {
                escaped = false;
            } else if byte == b'\\' {
                escaped = true;
            } else if byte == b'"' {
                closed = true;
                break;
            }
        }
        if closed {
            if let Some(value) = decode_string_preserving_controls(&source[start..cursor]) {
                values.push(value);
            }
            continue;
        }
        let mut suffix_start = source.len();
        let mut search_end = source.len();
        for expected in &container_stack {
            let Some((offset, actual)) = source[..search_end]
                .char_indices()
                .rev()
                .find(|(_, character)| !character.is_whitespace())
            else {
                break;
            };
            if actual as u8 != *expected {
                break;
            }
            suffix_start = offset;
            search_end = offset;
        }
        if suffix_start > start {
            let candidate = format!("{}\"", &source[start..suffix_start]);
            if let Some(value) = decode_string_preserving_controls(&candidate) {
                values.push(value);
            }
        }
        break;
    }
    values
}

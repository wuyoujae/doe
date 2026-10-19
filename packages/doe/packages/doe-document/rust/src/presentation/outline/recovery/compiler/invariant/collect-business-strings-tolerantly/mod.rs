// Origin: app/backend/core/src/outline_recovery/compiler/invariant.rs::collect_business_strings_tolerantly
use super::*;


pub(super) fn collect_business_strings_tolerantly(
    source: &str,
    depth: usize,
    values: &mut BTreeMap<String, usize>,
) {
    if depth > 2 {
        return;
    }
    let bytes = source.as_bytes();
    let mut cursor = 0usize;
    while cursor < bytes.len() {
        if bytes[cursor] != b'"' {
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
        if !closed {
            break;
        }
        let Some(value) = decode_string_preserving_controls(&source[start..cursor]) else {
            continue;
        };
        let next = source[cursor..]
            .chars()
            .find(|character| !character.is_whitespace());
        if next == Some(':') || value.trim().is_empty() {
            continue;
        }
        let trimmed = value.trim();
        if (trimmed.starts_with('{') || trimmed.starts_with('[')) && depth < 2 {
            collect_business_strings_tolerantly(trimmed, depth + 1, values);
        } else if !matches!(
            trimmed,
            "create"
                | "replace"
                | "edit"
                | "text_block"
                | "metric"
                | "metrics"
                | "timeline"
                | "process"
                | "strengths"
                | "comparison"
                | "table"
                | "illustrated_items"
                | "image"
                | "generated_image"
        ) {
            *values.entry(value).or_default() += 1;
        }
    }
}

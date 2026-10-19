// Origin: app/backend/core/src/outline_recovery/compiler/lexical.rs::strict_json_root_spans
use super::*;


pub(super) fn strict_json_root_spans(source: &str) -> Vec<SourceSpan> {
    let mut spans = Vec::new();
    let mut cursor = 0usize;
    while cursor < source.len() {
        let Some(relative_start) = source.as_bytes()[cursor..]
            .iter()
            .position(|byte| matches!(byte, b'{' | b'['))
        else {
            break;
        };
        let start = cursor + relative_start;
        let Some(end) = balanced_json_root_end(source, start) else {
            cursor = start + 1;
            continue;
        };
        let candidate = &source[start..end];
        if super::super::unique::parse_unique_json(candidate).is_ok() {
            spans.push(SourceSpan { start, end });
            cursor = end;
        } else {
            cursor = start + 1;
        }
    }
    spans
}

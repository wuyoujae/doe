// Origin: app/backend/core/src/outline_recovery/compiler/lexical.rs::source_lines
use super::*;


pub(super) fn source_lines(source: &str) -> Vec<SourceLine<'_>> {
    let mut lines = Vec::new();
    let mut start = 0usize;
    for segment in source.split_inclusive('\n') {
        let end = start + segment.len();
        lines.push(SourceLine {
            start,
            end,
            text: segment.trim_end_matches(['\r', '\n']),
        });
        start = end;
    }
    if start < source.len() || source.is_empty() {
        lines.push(SourceLine {
            start,
            end: source.len(),
            text: &source[start..],
        });
    }
    lines
}

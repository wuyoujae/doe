// Origin: app/backend/core/src/outline_recovery/compiler/lexical.rs::trimmed_span
use super::*;


pub(super) fn trimmed_span(source: &str, start: usize, end: usize) -> SourceSpan {
    let slice = &source[start..end];
    let trimmed_start = slice.trim_start();
    let bounded_start = end - trimmed_start.len();
    let trimmed = source[bounded_start..end].trim_end();
    SourceSpan {
        start: bounded_start,
        end: bounded_start + trimmed.len(),
    }
}

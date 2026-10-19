// Origin: app/backend/core/src/slide_recovery/grounding.rs::text_is_composed_from_sources
use super::*;


pub(super) fn text_is_composed_from_sources(
    candidate: &str,
    sources: &BTreeSet<String>,
    allow_synthetic_numbers: bool,
) -> bool {
    if candidate.is_empty() {
        return true;
    }
    let mut remainder = candidate;
    while !remainder.is_empty() {
        if allow_synthetic_numbers && remainder.starts_with(|value: char| value.is_ascii_digit()) {
            remainder = remainder.trim_start_matches(|value: char| value.is_ascii_digit());
            continue;
        }
        if sources.iter().any(|source| source.starts_with(remainder)) {
            // A final prefix is allowed because deterministic fallback applies a
            // bounded character truncation to Outline text.
            return true;
        }
        let Some(source) = sources
            .iter()
            .filter(|source| !source.is_empty() && remainder.starts_with(source.as_str()))
            .max_by_key(|source| source.len())
        else {
            return false;
        };
        remainder = &remainder[source.len()..];
    }
    true
}

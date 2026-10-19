// Origin: app/backend/core/src/slide_recovery/grounding.rs::insert_string_fact
use super::*;


pub(super) fn insert_string_fact(
    value: &str,
    key: Option<&str>,
    component_type: Option<&str>,
    output: &mut GuardedFacts,
) {
    let trimmed = if matches!(component_type, Some("list" | "ordered-list")) && key == Some("items") {
        strip_display_ordinal_prefix(value.trim())
    } else {
        value.trim()
    };
    if trimmed.is_empty() {
        return;
    }
    output.numbers.extend(number_tokens(trimmed));
    if is_url(trimmed) {
        output.urls.insert(trimmed.to_string());
    }
    let normalized = normalize(trimmed);
    if normalized.chars().count() >= 2 {
        output.strings.insert(normalized.clone());
        if key.is_some_and(is_attribution_key)
            || (component_type == Some("quote") && key == Some("text"))
        {
            output.attributions.insert(normalized);
        }
    }
}

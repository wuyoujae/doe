// Origin: app/backend/core/src/slide_recovery/mod.rs::deduplicate_projection_values
use super::*;


pub(super) fn deduplicate_projection_values(values: &mut Vec<String>) {
    let mut seen = HashSet::new();
    values.retain(|value| {
        let normalized = normalized_business_text(value);
        let key = if normalized.is_empty() {
            value.trim().to_lowercase()
        } else {
            normalized
        };
        seen.insert(key)
    });
}

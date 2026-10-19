// Origin: app/backend/core/src/slide_recovery/grounding.rs::is_attribution_key


pub(super) fn is_attribution_key(key: &str) -> bool {
    matches!(key, "author" | "source" | "citation")
}

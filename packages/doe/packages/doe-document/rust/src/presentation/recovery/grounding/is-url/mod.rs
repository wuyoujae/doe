// Origin: app/backend/core/src/slide_recovery/grounding.rs::is_url


pub(super) fn is_url(value: &str) -> bool {
    value.starts_with("https://")
        || value.starts_with("yrkie-asset-data://")
        || value.starts_with("yrkie-asset-base64://")
}

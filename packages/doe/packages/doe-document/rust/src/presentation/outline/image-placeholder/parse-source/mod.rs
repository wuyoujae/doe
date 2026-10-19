// Origin: app/backend/core/src/doe_outline_image_plugin.rs::parse_source
use super::*;


pub fn parse_source(source: &str) -> Result<Option<String>, String> {
    let normalized = normalize_marker_source(source);
    let source = normalized.as_deref().unwrap_or(source);
    if !source.starts_with(LEGACY_MARKER_PREFIX) {
        return Ok(None);
    }
    parse_prompt_body(
        source
            .strip_prefix(LEGACY_MARKER_PREFIX)
            .expect("checked legacy marker prefix"),
    )
    .map(Some)
}

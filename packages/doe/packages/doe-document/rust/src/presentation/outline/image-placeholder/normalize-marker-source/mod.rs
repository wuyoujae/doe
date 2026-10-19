// Origin: app/backend/core/src/doe_outline_image_plugin.rs::normalize_marker_source
use super::*;


/// Canonicalizes only a marker-like function name at the start of a complete
/// Outline content item. The grammar after the name remains untouched and is
/// parsed by `parse_doe_source`, so this fallback cannot rewrite ordinary prose.
pub fn normalize_marker_source(source: &str) -> Option<String> {
    let delimiter_index = source.find(['(', '['])?;
    let candidate = &source[..delimiter_index];
    if candidate.is_empty()
        || !candidate
            .bytes()
            .all(|byte| byte.is_ascii_alphabetic() || matches!(byte, b'_' | b'-'))
    {
        return None;
    }
    let normalized_name = candidate
        .bytes()
        .filter(|byte| !matches!(byte, b'_' | b'-'))
        .map(|byte| byte.to_ascii_lowercase())
        .collect::<Vec<_>>();
    bounded_edit_distance(
        &normalized_name,
        EXPECTED_MARKER_NAME.as_bytes(),
        MAX_MARKER_NAME_EDIT_DISTANCE,
    )?;
    Some(format!(
        "{CANONICAL_MARKER_NAME}{}",
        &source[delimiter_index..]
    ))
}

// Origin: app/backend/core/src/plugin_outline_validation.rs::text
use super::*;


pub fn text(v: &Value, path: &str, max: usize, errors: &mut Failure) {
    let Some(s) = v.as_str() else {
        errors.issue(
            path,
            "type",
            "Expected a string.",
            "Supply plain text, not an object, number or null.",
        );
        return;
    };
    if s.trim().is_empty() || s.len() > max {
        errors.issue(path, "text_length", "Text is empty or exceeds its UTF-8 byte limit.", &format!("Use non-whitespace content within {max} UTF-8 bytes. Non-ASCII characters can use multiple bytes."));
    }
    if s != s.trim() {
        errors.issue(
            path,
            "text_whitespace",
            "Leading or trailing whitespace would be changed by storage.",
            "Trim the string; internal spaces and line breaks are allowed.",
        );
    }
    if s.chars().any(|c| {
        (c.is_control() && !matches!(c, '\n' | '\t'))
            || matches!(c, '\u{202a}'..='\u{202e}' | '\u{2066}'..='\u{2069}')
    }) {
        errors.issue(
            path,
            "unsafe_control",
            "Unsupported control or directional override character.",
            "Remove control characters; use LF for line breaks.",
        );
    }
    if MARKUP.is_match(s) || ACTIVE_URI.is_match(s) {
        errors.issue(path, "unsafe_content", "Executable markup, active URI schemes or internal asset references are not accepted.", "Use plain text. Describe images with the documented GENRATEIMG marker; do not supply HTML, SVG, scripts or private asset paths.");
    }
}

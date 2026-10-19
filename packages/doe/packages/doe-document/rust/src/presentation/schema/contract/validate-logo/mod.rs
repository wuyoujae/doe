use super::*;

pub(super) fn validate_logo(value: &Value, path: &str) -> Result<(), String> {
    if value.is_null() { return Ok(()); }
    let logo = object(value, path)?;
    allowed_keys(logo, &["src"], path)?;
    let source = required(logo, "src", path)?.as_str().unwrap_or("");
    if source.is_empty() || source.len() > 2048 || source.trim() != source {
        return mismatch(format!("{path}.src must be a non-empty image reference"));
    }
    if source != "/yrkie-doe/brand/logo-text.webp" && !is_authoritative_image_source(source) {
        return mismatch(format!("{path}.src must reference a managed image or the built-in Yrkie logo"));
    }
    Ok(())
}

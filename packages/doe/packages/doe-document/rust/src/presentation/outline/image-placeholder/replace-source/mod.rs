// Origin: app/backend/core/src/doe_outline_image_plugin.rs::replace_source
use super::*;


pub fn replace_source(
    document: &mut Value,
    json_pointer: &str,
    expected_source: &str,
    asset_reference: &str,
) -> Result<(), String> {
    let source = document
        .pointer(json_pointer)
        .and_then(|value| value.as_str())
        .ok_or_else(|| "DOE Outline generated image path is missing.".to_string())?;
    if source != expected_source {
        return Err("DOE Outline generated image placeholder changed before commit.".to_string());
    }
    *document
        .pointer_mut(json_pointer)
        .ok_or_else(|| "DOE Outline generated image path is missing.".to_string())? =
        Value::String(asset_reference.to_string());
    Ok(())
}

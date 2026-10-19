// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_slide_background
use super::*;


pub(super) fn validate_slide_background(value: &Value, path: &str) -> Result<(), String> {
    let background = object(value, path)?;
    allowed_keys(
        background,
        &["enabled", "src", "fit", "position", "foreground", "overlay", "contentAlign", "contentVerticalAlign", "contentWidth", "textSurface"],
        path,
    )?;
    if let Some(overlay) = background.get("overlay") {
        if overlay == &Value::Bool(false) {
            return Ok(());
        }
        let overlay_path = format!("{path}.overlay");
        let overlay = object(overlay, &overlay_path)?;
        allowed_keys(overlay, &["opacity", "direction"], &overlay_path)?;
    }
    Ok(())
}

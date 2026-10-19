// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_background
use super::*;


pub(super) fn validate_authorable_background(value: &Value, path: &str) -> Result<(), String> {
    let background = object(value, path)?;
    required_text(background, "src", path)?;
    validate_authorable_optional_bool(background, "enabled", path)?;
    validate_authorable_optional_enum(background, "fit", path, &["cover", "contain"])?;
    validate_authorable_optional_text(background, "position", path)?;
    validate_authorable_optional_enum(background, "foreground", path, &["auto", "light", "dark"])?;
    validate_authorable_optional_enum(background, "contentAlign", path, &["left", "center", "right"])?;
    validate_authorable_optional_enum(background, "contentVerticalAlign", path, &["top", "center", "bottom"])?;
    validate_authorable_optional_enum(background, "textSurface", path, &["auto", "none"])?;
    if let Some(width) = background.get("contentWidth") {
        let width = finite_number(width, &format!("{path}.contentWidth"))?;
        if !(0.2..=1.0).contains(&width) {
            return mismatch(format!("{path}.contentWidth must be between 0.2 and 1"));
        }
    }
    if let Some(overlay) = background.get("overlay") {
        if overlay == &Value::Bool(false) {
            return Ok(());
        }
        let overlay_path = format!("{path}.overlay");
        let overlay = object(overlay, &overlay_path)?;
        if let Some(opacity) = overlay.get("opacity") {
            let opacity = finite_number(opacity, &format!("{overlay_path}.opacity"))?;
            if !(0.0..=0.9).contains(&opacity) {
                return mismatch(format!("{overlay_path}.opacity must be between 0 and 0.9"));
            }
        }
        validate_authorable_optional_enum(
            overlay,
            "direction",
            &overlay_path,
            &["to-right", "to-left", "to-bottom", "to-top"],
        )?;
    }
    Ok(())
}

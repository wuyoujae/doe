// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_slide_layout
use super::*;


pub(super) fn validate_authorable_slide_layout(value: &Value, path: &str) -> Result<(), String> {
    let layout = object(value, path)?;
    allowed_keys(layout, &["preset"], path)?;
    validate_authorable_optional_enum(
        layout,
        "preset",
        path,
        &["flow", "narrative", "balanced", "dashboard", "edge-media"],
    )?;
    Ok(())
}

// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_leaf_layout
use super::*;


pub(super) fn validate_authorable_leaf_layout(value: &Value, path: &str) -> Result<(), String> {
    let layout = object(value, path)?;
    allowed_keys(layout, &["span", "region"], path)?;
    if let Some(span) = layout.get("span") {
        if span.as_str().is_some() {
            validate_authorable_enum(span, &format!("{path}.span"), &["auto", "full", "half"])?;
        } else {
            validate_authorable_integer_range(span, &format!("{path}.span"), 1, 12)?;
        }
    }
    validate_authorable_optional_enum(layout, "region", path, &["content", "media"])?;
    Ok(())
}

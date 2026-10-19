// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::validate_image_component
use super::*;


pub(super) fn validate_image_component(object: &Map<String, Value>, field: &str) -> Result<(), String> {
    let component_type = required_string(object, "type", field)?;
    let src = required_string(object, "src", field)?;
    validate_non_empty_string(src, &format!("{field}.src"))?;
    if component_type == "image" && !src.starts_with("https://") {
        return Err(format!("{field}.src must be a direct HTTPS URL."));
    }
    if component_type == "generated_image" {
        let materialized_asset = src
            .strip_prefix("yrkie-asset-data://")
            .is_some_and(|asset_id| {
                asset_id.len() == 64
                    && asset_id
                        .bytes()
                        .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
            });
        let placeholder =
            crate::presentation::outline::image_placeholder::parse_source(src)?.is_some();
        if !(src.starts_with("https://") || materialized_asset || placeholder) {
            return Err(format!(
                "{field}.src must be GENRATEIMG(description), a materialized asset reference, or a direct HTTPS URL."
            ));
        }
    }
    let ratio = required_string(object, "ratio", field)?;
    if !["16:9", "4:3", "3:4", "1:1", "9:16"].contains(&ratio) {
        return Err(format!("{field}.ratio is invalid."));
    }
    validate_non_empty_string(
        required_string(object, "role", field)?,
        &format!("{field}.role"),
    )
}

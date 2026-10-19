// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_agent_image_sources_strict
use super::*;


pub fn validate_agent_image_sources_strict(
    value: &Value,
    allowed_image_sources: &[String],
) -> Result<(), String> {
    let mut seen = HashSet::new();
    let allowed = allowed_image_sources
        .iter()
        .filter(|source| is_authoritative_image_source(source))
        .filter(|source| seen.insert(source.as_str()))
        .map(String::as_str)
        .collect::<Vec<_>>();

    fn validate(value: &Value, allowed: &[&str], image_source_field: bool) -> Result<(), String> {
        match value {
            Value::String(source) => {
                if (image_source_field || looks_like_managed_asset_reference(source))
                    && !source.is_empty()
                    && source != "/yrkie-doe/brand/logo-text.webp"
                    && !allowed.contains(&source.as_str())
                {
                    return Err(asset_reference_mismatch());
                }
                Ok(())
            }
            Value::Array(items) => items
                .iter()
                .try_for_each(|item| validate(item, allowed, false)),
            Value::Object(object) => object
                .iter()
                .try_for_each(|(key, item)| validate(item, allowed, key == "src")),
            _ => Ok(()),
        }
    }

    validate(value, &allowed, false)
}

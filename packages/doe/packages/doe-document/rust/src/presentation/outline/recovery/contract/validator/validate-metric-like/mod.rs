// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::validate_metric_like
use super::*;


pub(super) fn validate_metric_like(object: &Map<String, Value>, field: &str) -> Result<(), String> {
    validate_non_empty_string(
        required_string(object, "label", field)?,
        &format!("{field}.label"),
    )?;
    validate_string_or_number(object.get("value"), &format!("{field}.value"))?;
    for key in ["unit", "period", "comparison"] {
        if let Some(value) = object.get(key) {
            validate_non_empty_string(
                value
                    .as_str()
                    .ok_or_else(|| format!("{field}.{key} must be a string."))?,
                &format!("{field}.{key}"),
            )?;
        }
    }
    Ok(())
}

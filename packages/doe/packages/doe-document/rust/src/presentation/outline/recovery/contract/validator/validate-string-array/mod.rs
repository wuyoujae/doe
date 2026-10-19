// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::validate_string_array
use super::*;


pub(super) fn validate_string_array(
    values: &[Value],
    field: &str,
    min: usize,
    max: usize,
) -> Result<(), String> {
    if values.len() < min || values.len() > max {
        return Err(format!("{field} has an invalid number of items."));
    }
    for (index, value) in values.iter().enumerate() {
        validate_non_empty_string(
            value
                .as_str()
                .ok_or_else(|| format!("{field}[{index}] must be a string."))?,
            &format!("{field}[{index}]"),
        )?;
    }
    Ok(())
}

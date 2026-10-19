// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::validate_string_or_number
use super::*;


pub(super) fn validate_string_or_number(value: Option<&Value>, field: &str) -> Result<(), String> {
    match value {
        Some(Value::String(value)) => validate_non_empty_string(value, field),
        Some(Value::Number(value)) if value.as_f64().is_some_and(f64::is_finite) => Ok(()),
        _ => Err(format!("{field} must be a string or number.")),
    }
}

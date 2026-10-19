// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::validate_non_empty_string
use super::*;


pub(super) fn validate_non_empty_string(value: &str, field: &str) -> Result<(), String> {
    if value.trim().is_empty() {
        return Err(format!("{field} must not be empty."));
    }
    if value.len() > MAX_OUTLINE_CONTENT_LEN {
        return Err(format!("{field} is too long."));
    }
    Ok(())
}

// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::validate_semantic_name


pub(super) fn validate_semantic_name(value: &str, field: &str) -> Result<(), String> {
    if value.is_empty() || value.len() > 64 {
        return Err(format!("{field} has an invalid semantic node name."));
    }
    let mut previous_underscore = false;
    for (index, ch) in value.chars().enumerate() {
        let valid = if index == 0 {
            ch.is_ascii_lowercase()
        } else {
            ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '_'
        };
        if !valid || ch == '_' && previous_underscore {
            return Err(format!("{field} must use semantic lowercase snake_case."));
        }
        previous_underscore = ch == '_';
    }
    if value.ends_with('_') {
        return Err(format!("{field} must use semantic lowercase snake_case."));
    }
    Ok(())
}

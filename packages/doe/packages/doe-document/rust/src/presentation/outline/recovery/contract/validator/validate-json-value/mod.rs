// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::validate_json_value
use super::*;


pub(super) fn validate_json_value(value: &Value, field: &str, depth: usize) -> Result<(), String> {
    if depth > MAX_OUTLINE_VALUE_DEPTH {
        return Err(format!("{field} exceeds the maximum nesting depth."));
    }
    match value {
        Value::String(value) if value.len() > MAX_OUTLINE_CONTENT_LEN => {
            return Err(format!("{field} contains a string that is too long."));
        }
        Value::Number(value) if value.as_f64().is_none_or(|number| !number.is_finite()) => {
            return Err(format!("{field} contains a non-finite number."));
        }
        Value::Array(values) => {
            if values.len() > MAX_OUTLINE_CONTENT_ITEMS {
                return Err(format!("{field} contains too many array items."));
            }
            for (index, value) in values.iter().enumerate() {
                validate_json_value(value, &format!("{field}[{index}]"), depth + 1)?;
            }
        }
        Value::Object(values) => {
            if values.len() > MAX_OUTLINE_CONTENT_ITEMS {
                return Err(format!("{field} contains too many object properties."));
            }
            for (key, value) in values {
                if matches!(key.as_str(), "__proto__" | "prototype" | "constructor") {
                    return Err(format!("{field} contains a forbidden property name."));
                }
                validate_json_value(value, &format!("{field}.{key}"), depth + 1)?;
            }
        }
        _ => {}
    }
    Ok(())
}

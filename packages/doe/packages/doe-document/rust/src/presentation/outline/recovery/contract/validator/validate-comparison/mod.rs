// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::validate_comparison
use super::*;


pub(super) fn validate_comparison(object: &Map<String, Value>, field: &str) -> Result<(), String> {
    let dimensions = required_array(object, "dimensions", field)?;
    validate_string_array(dimensions, &format!("{field}.dimensions"), 1, 100)?;
    for (index, item) in required_non_empty_object_array(object, "items", field)? {
        let item_field = format!("{field}.items[{index}]");
        require_exact_keys(item, &["name", "values"], &item_field)?;
        validate_non_empty_string(
            required_string(item, "name", &item_field)?,
            &format!("{item_field}.name"),
        )?;
        let values = required_array(item, "values", &item_field)?;
        if values.len() != dimensions.len() {
            return Err(format!("{item_field}.values must match dimensions length."));
        }
        for (value_index, value) in values.iter().enumerate() {
            if !value.is_null() {
                validate_string_or_number(
                    Some(value),
                    &format!("{item_field}.values[{value_index}]"),
                )?;
            }
        }
    }
    Ok(())
}

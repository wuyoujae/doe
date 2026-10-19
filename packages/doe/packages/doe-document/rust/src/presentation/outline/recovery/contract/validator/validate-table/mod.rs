// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::validate_table
use super::*;


pub(super) fn validate_table(object: &Map<String, Value>, field: &str) -> Result<(), String> {
    let columns = required_non_empty_object_array(object, "columns", field)?;
    let mut keys = HashSet::new();
    for (index, column) in &columns {
        let column_field = format!("{field}.columns[{index}]");
        require_exact_keys(column, &["key", "label"], &column_field)?;
        let key = required_string(column, "key", &column_field)?;
        validate_semantic_name(key, &format!("{column_field}.key"))?;
        validate_non_empty_string(
            required_string(column, "label", &column_field)?,
            &format!("{column_field}.label"),
        )?;
        if !keys.insert(key.to_string()) {
            return Err(format!("{field}.columns contains duplicate key '{key}'."));
        }
    }
    for (index, row) in required_non_empty_object_array(object, "rows", field)? {
        let row_field = format!("{field}.rows[{index}]");
        if row.len() != keys.len() || row.keys().any(|key| !keys.contains(key)) {
            return Err(format!(
                "{row_field} properties must match table column keys."
            ));
        }
        for (key, value) in row {
            if !(value.is_string() || value.is_number() || value.is_boolean() || value.is_null()) {
                return Err(format!(
                    "{row_field}.{key} has an invalid table cell value."
                ));
            }
        }
    }
    Ok(())
}

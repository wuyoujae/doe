// Origin: app/backend/core/src/outline_recovery/contract/validator.rs::required_non_empty_object_array
use super::*;


pub(super) fn required_non_empty_object_array<'a>(
    object: &'a Map<String, Value>,
    key: &str,
    field: &str,
) -> Result<Vec<(usize, &'a Map<String, Value>)>, String> {
    let values = required_array(object, key, field)?;
    if values.is_empty() || values.len() > MAX_OUTLINE_CONTENT_ITEMS {
        return Err(format!("{field}.{key} must be a bounded non-empty array."));
    }
    values
        .iter()
        .enumerate()
        .map(|(index, value)| {
            value
                .as_object()
                .map(|object| (index, object))
                .ok_or_else(|| format!("{field}.{key}[{index}] must be an object."))
        })
        .collect()
}

// Origin: app/backend/core/src/slide_recovery/mod.rs::is_empty_control_value
use super::*;


pub(super) fn is_empty_control_value(value: &Value) -> bool {
    value.is_null()
        || value.as_object().is_some_and(Map::is_empty)
        || value.as_array().is_some_and(Vec::is_empty)
        || value.as_str().is_some_and(str::is_empty)
}

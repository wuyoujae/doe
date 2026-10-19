// Origin: app/backend/core/src/doe_slide_edit/operations.rs::nodes
use super::*;


pub(super) fn nodes(slide: &mut Value) -> Result<&mut Vec<Value>, String> {
    slide
        .get_mut("blocks")
        .and_then(Value::as_array_mut)
        .ok_or_else(|| "doe_slide_edit_invalid_blocks".into())
}

// Origin: app/backend/core/src/slide_recovery/mod.rs::slide_id
use super::*;


pub(super) fn slide_id(slide: &Value, page_index: usize) -> String {
    slide
        .get("id")
        .and_then(Value::as_str)
        .map(str::to_string)
        .unwrap_or_else(|| format!("page-{page_index}"))
}

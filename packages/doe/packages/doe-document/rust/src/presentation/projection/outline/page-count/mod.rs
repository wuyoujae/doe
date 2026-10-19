// Origin: app/backend/core/src/plugin_outline_markdown.rs::page_count
use super::*;


pub fn page_count(value: &Value) -> Result<usize, String> {
    let pages = value
        .get("slides")
        .or_else(|| value.get("body"))
        .and_then(Value::as_array)
        .ok_or("outline_unavailable")?;
    if pages.len() > 200 {
        return Err("outline_too_large".into());
    }
    Ok(pages.len())
}

// Origin: app/backend/core/src/slide_recovery/model_io.rs::grounded_deck_title
use super::*;


pub fn grounded_deck_title(provider_context: &Value) -> Result<String, String> {
    let outline = provider_context
        .get("confirmed_outline")
        .and_then(|outline| outline.get("outline"))
        .ok_or_else(|| "slide_recovery_fallback_outline_missing".to_string())?;
    if let Some(title) = outline
        .get("title")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|title| !title.is_empty())
    {
        return Ok(truncate_text(title, 240));
    }
    let first_page = outline
        .get("slides")
        .and_then(Value::as_array)
        .and_then(|slides| slides.first())
        .ok_or_else(|| "slide_recovery_fallback_outline_page_missing".to_string())?;
    grounded_outline_strings(first_page)
        .into_iter()
        .next()
        .map(|title| truncate_text(&title, 240))
        .ok_or_else(|| "slide_recovery_full_regeneration_title_missing".to_string())
}

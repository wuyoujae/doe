// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_root
use super::*;


pub(super) fn validate_root(value: &Value, expectations: SlideDeckExpectations) -> Result<(), String> {
    let root = object(value, "root")?;
    allowed_keys(root, &["version", "pageNumber", "logo", "deck"], "root")?;
    if root.get("version").and_then(Value::as_i64) != Some(4) {
        return mismatch("root.version must equal 4");
    }
    if let Some(logo) = root.get("logo") { validate_logo(logo, "root.logo")?; }
    let page_number_path = "root.pageNumber";
    let page_number = object(required(root, "pageNumber", "root")?, page_number_path)?;
    allowed_keys(page_number, &["enabled", "format"], page_number_path)?;
    if !required(page_number, "enabled", page_number_path)?.is_boolean() {
        return mismatch("root.pageNumber.enabled must be a boolean");
    }
    match required(page_number, "format", page_number_path)?.as_str() {
        Some("number" | "fraction") => {}
        _ => return mismatch("root.pageNumber.format must equal number or fraction"),
    }
    let deck = object(required(root, "deck", "root")?, "root.deck")?;
    allowed_keys(deck, &["title", "theme", "slides"], "root.deck")?;
    let title = nonempty_text(required(deck, "title", "root.deck")?, "root.deck.title")?;
    if title.chars().count() > crate::presentation::schema::limits::MAX_SESSION_TITLE_CHARS {
        return mismatch(format!(
            "root.deck.title cannot exceed {} characters",
            crate::presentation::schema::limits::MAX_SESSION_TITLE_CHARS
        ));
    }
    if required(deck, "theme", "root.deck")?.as_str() != Some(registered_theme_id(required(deck, "theme", "root.deck")?.as_str())) {
        return mismatch("root.deck.theme must name a registered theme");
    }
    let slides = array(required(deck, "slides", "root.deck")?, "root.deck.slides")?;
    if slides.len() != expectations.slide_count {
        return mismatch(format!(
            "root.deck.slides must contain exactly {} slides",
            expectations.slide_count
        ));
    }

    let mut slide_ids = HashSet::new();
    for (index, slide) in slides.iter().enumerate() {
        validate_slide(slide, index, &mut slide_ids)?;
    }
    Ok(())
}

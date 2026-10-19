// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_slide
use super::*;


pub(super) fn validate_slide(
    value: &Value,
    index: usize,
    slide_ids: &mut HashSet<String>,
) -> Result<(), String> {
    let path = format!("root.deck.slides[{index}]");
    let slide = object(value, &path)?;
    allowed_keys(
        slide,
        &["id", "size", "editor", "logo", "background", "layout", "blocks"],
        &path,
    )?;
    let id = identifier(required(slide, "id", &path)?, &format!("{path}.id"))?;
    if !slide_ids.insert(id.to_string()) {
        return mismatch(format!("{path}.id must be unique within the Deck"));
    }

    let size_path = format!("{path}.size");
    let size = object(required(slide, "size", &path)?, &size_path)?;
    allowed_keys(size, &["width", "height", "unit"], &size_path)?;
    if size.get("width").and_then(Value::as_i64) != Some(960)
        || size.get("height").and_then(Value::as_i64) != Some(540)
        || size.get("unit").and_then(Value::as_str) != Some("pt")
    {
        return mismatch(format!("{size_path} must equal 960 x 540 pt"));
    }
    if slide.get("editor").is_some_and(|value| !value.is_boolean()) {
        return mismatch(format!("{path}.editor must be a boolean"));
    }
    if let Some(logo) = slide.get("logo") { validate_logo(logo, &format!("{path}.logo"))?; }
    if let Some(background) = slide.get("background") {
        if !background.is_null() {
            validate_slide_background(background, &format!("{path}.background"))?;
        }
    }
    if let Some(layout) = slide.get("layout") {
        if !layout.is_null() {
            let layout_path = format!("{path}.layout");
            object(layout, &layout_path)?;
            reject_theme_managed_component_styles(layout, &layout_path)?;
        }
    }

    let blocks = array(required(slide, "blocks", &path)?, &format!("{path}.blocks"))?;
    if blocks.is_empty() {
        return mismatch(format!("{path}.blocks must not be empty"));
    }
    let mut node_ids = HashSet::new();
    let mut node_count = 0usize;
    for (node_index, node) in blocks.iter().enumerate() {
        validate_node(
            node,
            &format!("{path}.blocks[{node_index}]"),
            0,
            &mut node_ids,
            &mut node_count,
        )?;
    }
    Ok(())
}

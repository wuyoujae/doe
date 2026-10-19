// Origin: app/backend/core/src/slide_agent_output_contract/validation.rs::validate
use super::*;


pub(super) fn validate(slide: &Value) -> Result<(), String> {
    if slide.to_string().len() > crate::presentation::schema::safety::MAX_SLIDE_BYTES {
        return mismatch("root exceeds the 2,000,000-byte slide limit");
    }
    let mut compatible = slide.clone();
    normalize_retired_text_roles(&mut compatible);
    let slide = &compatible;
    let page = object(slide, "root")?;
    identifier(required(page, "id", "root")?, "root.id")?;
    let size = object(required(page, "size", "root")?, "root.size")?;
    if size.get("width").and_then(Value::as_i64) != Some(960)
        || size.get("height").and_then(Value::as_i64) != Some(540)
        || size.get("unit").and_then(Value::as_str) != Some("pt")
    {
        return mismatch("root.size must equal 960 x 540 pt");
    }
    validate_authorable_optional_bool(page, "editor", "root")?;
    if let Some(logo) = page.get("logo") { validate_logo(logo, "root.logo")?; }
    if let Some(background) = page.get("background").filter(|v| !v.is_null()) {
        validate_authorable_background(background, "root.background")?;
    }
    if let Some(layout) = page.get("layout").filter(|v| !v.is_null()) {
        validate_authorable_slide_layout(
            &fields(layout, "root.layout", &["preset"])?,
            "root.layout",
        )?;
    }
    let blocks = array(required(page, "blocks", "root")?, "root.blocks")?;
    if blocks.is_empty() {
        return mismatch("root.blocks must not be empty");
    }
    let mut ids = HashSet::new();
    let mut edge_roots = 0;
    for (index, node) in blocks.iter().enumerate() {
        edge_roots += usize::from(validate_node_content(
            node,
            &format!("root.blocks[{index}]"),
            0,
            0,
            &mut ids,
        )?);
    }
    let edge_preset = slide["layout"]["preset"] == "edge-media";
    if edge_preset != (edge_roots == 1) || (edge_roots > 0 && blocks.len() != 1) {
        return mismatch("root.layout.preset edge-media requires exactly one root edge-media Group and no other root blocks");
    }
    if edge_roots > 0 && page.get("background").is_some_and(|v| !v.is_null()) {
        return mismatch("root.background cannot be combined with edge-media");
    }
    Ok(())
}

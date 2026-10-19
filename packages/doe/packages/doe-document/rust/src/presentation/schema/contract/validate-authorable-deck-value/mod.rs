// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_deck_value
use super::*;


pub fn validate_authorable_deck_value(
    value: &Value,
    expectations: SlideDeckExpectations,
) -> Result<(), String> {
    let mut compatible = value.clone();
    normalize_retired_text_roles(&mut compatible);
    let value = &compatible;
    validate_root(value, expectations)?;
    reject_authorable_nulls(value, "root")?;

    for (slide_index, slide) in value["deck"]["slides"]
        .as_array()
        .expect("validated Deck slides")
        .iter()
        .enumerate()
    {
        let path = format!("root.deck.slides[{slide_index}]");
        let slide = slide.as_object().expect("validated Slide");
        if slide.contains_key("editor") {
            return mismatch(format!(
                "{path}.editor is Runtime state and cannot be authored"
            ));
        }
        if let Some(background) = slide.get("background") {
            validate_authorable_background(background, &format!("{path}.background"))?;
        }
        if let Some(layout) = slide.get("layout") {
            validate_authorable_slide_layout(layout, &format!("{path}.layout"))?;
        }
        let blocks = slide["blocks"].as_array().expect("validated Slide blocks");
        let mut edge_media_roots = 0usize;
        for (node_index, node) in blocks.iter().enumerate() {
            edge_media_roots += usize::from(validate_authorable_node(
                node,
                &format!("{path}.blocks[{node_index}]"),
                true,
            )?);
        }
        let edge_media_preset = slide
            .get("layout")
            .and_then(Value::as_object)
            .and_then(|layout| layout.get("preset"))
            .and_then(Value::as_str)
            == Some("edge-media");
        if edge_media_preset && (blocks.len() != 1 || edge_media_roots != 1) {
            return mismatch(format!(
                "{path} with edge-media preset must contain exactly one root edge-media Group"
            ));
        }
        if edge_media_roots > 0 && !edge_media_preset {
            return mismatch(format!(
                "{path} with a root edge-media Group must use the edge-media preset"
            ));
        }
        if edge_media_roots > 0 && slide.contains_key("background") {
            return mismatch(format!(
                "{path}.background cannot be combined with edge-media"
            ));
        }
    }
    Ok(())
}

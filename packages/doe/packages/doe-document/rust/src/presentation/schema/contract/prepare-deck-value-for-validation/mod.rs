// Origin: app/backend/core/src/slide_agent_output_contract.rs::prepare_deck_value_for_validation
use super::*;


pub fn prepare_deck_value_for_validation(
    raw: &str,
    allowed_image_sources: Option<&[String]>,
) -> Result<(Value, usize), String> {
    if raw.trim().is_empty() {
        return Err(format!("{EMPTY_OUTPUT_ERROR}: response body was empty"));
    }
    if raw.as_bytes().len() > MAX_OUTPUT_BYTES {
        return Err(format!(
            "{OUTPUT_TOO_LARGE_ERROR}: response exceeded {MAX_OUTPUT_BYTES} bytes"
        ));
    }
    let mut value = parse_json_with_bounded_delimiter_repair(raw)?;
    normalize_redundant_deck_canvas(&mut value);
    normalize_misplaced_leaf_slot_space(&mut value);
    normalize_page_number(&mut value);
    normalize_theme(&mut value);
    normalize_theme_managed_component_styles(&mut value);
    let image_source_repair_count = match allowed_image_sources {
        Some(sources) => normalize_agent_image_sources(&mut value, sources)?,
        None => 0,
    };
    Ok((value, image_source_repair_count))
}

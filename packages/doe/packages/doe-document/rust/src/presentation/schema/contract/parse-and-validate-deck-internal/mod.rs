// Origin: app/backend/core/src/slide_agent_output_contract.rs::parse_and_validate_deck_internal
use super::*;


pub(super) fn parse_and_validate_deck_internal(
    raw: &str,
    expectations: SlideDeckExpectations,
    allowed_image_sources: Option<&[String]>,
) -> Result<ParsedSlideDeck, String> {
    let (mut value, image_source_repair_count) =
        prepare_deck_value_for_validation(raw, allowed_image_sources)?;
    normalize_agent_theme_managed_layout_fields(&mut value);
    validate_root(&value, expectations)?;
    parsed_deck_from_valid_value(value, image_source_repair_count)
}

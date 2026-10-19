// Origin: app/backend/core/src/slide_agent_output_contract.rs::parse_and_validate_agent_deck
use super::*;


pub fn parse_and_validate_agent_deck(
    raw: &str,
    expectations: SlideDeckExpectations,
    allowed_image_sources: &[String],
) -> Result<ParsedSlideDeck, String> {
    parse_and_validate_deck_internal(raw, expectations, Some(allowed_image_sources))
}

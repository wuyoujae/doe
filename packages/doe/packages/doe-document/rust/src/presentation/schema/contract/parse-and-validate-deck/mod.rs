// Origin: app/backend/core/src/slide_agent_output_contract.rs::parse_and_validate_deck
use super::*;


pub fn parse_and_validate_deck(
    raw: &str,
    expectations: SlideDeckExpectations,
) -> Result<ParsedSlideDeck, String> {
    parse_and_validate_deck_internal(raw, expectations, None)
}

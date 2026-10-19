// Origin: app/backend/core/src/slide_agent_output_contract.rs::parse_and_validate
use super::*;


pub fn parse_and_validate(
    raw: &str,
    expectations: SlideDeckExpectations,
) -> Result<String, String> {
    parse_and_validate_deck(raw, expectations).map(|parsed| parsed.canonical_json)
}

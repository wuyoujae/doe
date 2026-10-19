// Origin: app/backend/core/src/slide_agent_output_contract.rs::parse_and_validate_work_editor_deck
use super::*;


/// Parses a Deck submitted by the authenticated Work Editor.
///
/// Interactive editing is not an Agent authoring boundary: component props may
/// contain historical compatibility fields, runtime state, or temporarily
/// incomplete content that the editor can still render and repair. Keep the
/// storage boundary aligned with the browser parser by validating only the
/// canonical Deck/Slide envelope here. Agent output continues to use the strict
/// component contract through `parse_and_validate_deck`.
pub fn parse_and_validate_work_editor_deck(
    raw: &str,
    expectations: SlideDeckExpectations,
) -> Result<ParsedSlideDeck, String> {
    let (value, image_source_repair_count) = prepare_deck_value_for_validation(raw, None)?;
    validate_work_editor_root(&value, expectations)?;
    parsed_deck_from_valid_value(value, image_source_repair_count)
}

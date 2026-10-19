// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_deck_value
use super::*;


pub fn validate_deck_value(
    value: &Value,
    expectations: SlideDeckExpectations,
) -> Result<(), String> {
    validate_root(value, expectations)
}

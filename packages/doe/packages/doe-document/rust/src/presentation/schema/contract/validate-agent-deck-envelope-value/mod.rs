// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_agent_deck_envelope_value
use super::*;


pub fn validate_agent_deck_envelope_value(
    value: &Value,
    expectations: SlideDeckExpectations,
) -> Result<(), String> {
    validate_work_editor_root(value, expectations)
}

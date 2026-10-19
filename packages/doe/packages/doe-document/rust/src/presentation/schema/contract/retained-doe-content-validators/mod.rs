// Origin: app/backend/core/src/slide_agent_output_contract.rs::retained_doe_content_validators
use super::*;

// Keep both disabled DOE validators linked and available for targeted
// diagnostics without exposing either one to the production acceptance path.
#[allow(dead_code)]
pub(super) fn retained_doe_content_validators() {
    let _validators: [fn(&Value, SlideDeckExpectations) -> Result<(), String>; 2] = [
        validate_authorable_deck_value,
        validate_agent_deck_envelope_value,
    ];
}

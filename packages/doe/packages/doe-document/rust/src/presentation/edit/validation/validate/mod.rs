// Origin: app/backend/core/src/doe_slide_edit/validation.rs::validate
use super::*;


pub fn validate(before: &Snapshot, candidate: &Value) -> Result<(), Failure> {
    contract::validate_agent_deck_envelope_value(
        &before.envelope(candidate.clone()),
        contract::SlideDeckExpectations::new(1).expect("one bound page"),
    )
    .map_err(|error| crate::presentation::schema::safety::diagnostic(&error, ""))?;
    contract::validation::validate_slide(candidate)?;
    changed_safety(&before.slide, candidate, "")
}

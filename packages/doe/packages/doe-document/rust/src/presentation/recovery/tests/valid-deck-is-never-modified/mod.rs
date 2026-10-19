// Origin: app/backend/core/src/slide_recovery/tests.rs::valid_deck_is_never_modified
use super::*;


#[test]
pub(super) fn valid_deck_is_never_modified() {
    let value = deck(vec![valid_slide("slide-1", "Original")]);
    let outcome = recover_agent_deck(&value.to_string(), expectations(1), &[]).unwrap();

    assert_eq!(
        outcome.proof.disposition,
        SlideRecoveryDisposition::Original
    );
    assert!(outcome.proof.edits.is_empty());
    assert_eq!(
        serde_json::from_str::<Value>(&outcome.parsed.canonical_json).unwrap(),
        value
    );
}

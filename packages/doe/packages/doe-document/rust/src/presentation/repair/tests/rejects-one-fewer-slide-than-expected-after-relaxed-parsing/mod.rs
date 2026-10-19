// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::rejects_one_fewer_slide_than_expected_after_relaxed_parsing
use super::*;


#[test]
pub(super) fn rejects_one_fewer_slide_than_expected_after_relaxed_parsing() {
    let error = process_with_slide_count(&valid_deck_with_slide_count(1), 2, true).unwrap_err();

    assert_eq!(
        error,
        "slide_agent_schema_mismatch: root.deck.slides must contain exactly 2 slides"
    );
}

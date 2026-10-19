// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::accepts_the_exact_expected_slide_count_after_relaxed_parsing
use super::*;


#[test]
pub(super) fn accepts_the_exact_expected_slide_count_after_relaxed_parsing() {
    let processed = process_with_slide_count(&valid_deck_with_slide_count(2), 2, true).unwrap();

    assert_eq!(processed.parsed.slides.len(), 2);
}

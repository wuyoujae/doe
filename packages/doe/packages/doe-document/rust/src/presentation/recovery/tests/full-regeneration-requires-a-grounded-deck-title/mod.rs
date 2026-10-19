// Origin: app/backend/core/src/slide_recovery/tests.rs::full_regeneration_requires_a_grounded_deck_title
use super::*;


#[test]
pub(super) fn full_regeneration_requires_a_grounded_deck_title() {
    assert!(plan_full_page_regeneration("", expectations(1), "").is_err());
    let context = json!({"confirmed_outline": {"outline": {"slides": []}}});
    assert!(model_io::grounded_deck_title(&context).is_err());
}

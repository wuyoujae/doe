// Origin: app/backend/core/src/slide_recovery/mod.rs::candidate_shape_rank
use super::*;


pub(super) fn candidate_shape_rank(value: &Value, expectations: SlideDeckExpectations) -> Option<usize> {
    let root = value.as_object()?;
    let deck = root.get("deck")?.as_object()?;
    let slides = deck.get("slides")?.as_array()?;
    (slides.len() == expectations.slide_count).then_some(0)
}

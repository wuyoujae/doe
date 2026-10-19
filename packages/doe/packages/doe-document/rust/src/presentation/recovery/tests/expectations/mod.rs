// Origin: app/backend/core/src/slide_recovery/tests.rs::expectations
use super::*;


pub(super) fn expectations(slides: usize) -> SlideDeckExpectations {
    SlideDeckExpectations::new(slides).unwrap()
}

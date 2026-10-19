// Origin: app/backend/core/src/slide_recovery/mod.rs::candidate_slides
use super::*;


pub(super) fn candidate_slides(candidate: &Value) -> Option<&Vec<Value>> {
    candidate.get("deck")?.get("slides")?.as_array()
}

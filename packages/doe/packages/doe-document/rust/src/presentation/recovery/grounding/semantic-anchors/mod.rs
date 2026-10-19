// Origin: app/backend/core/src/slide_recovery/grounding.rs::semantic_anchors
use super::*;


pub(super) fn semantic_anchors(value: &Value, source: AnchorSource) -> Vec<String> {
    let mut facts = GuardedFacts::default();
    match source {
        AnchorSource::Outline => collect_outline_guarded_facts(value, &mut facts),
        AnchorSource::Slide => collect_slide_guarded_facts(value, &mut facts),
    }
    facts
        .strings
        .into_iter()
        .filter(|value| value.chars().count() >= 4)
        .collect()
}

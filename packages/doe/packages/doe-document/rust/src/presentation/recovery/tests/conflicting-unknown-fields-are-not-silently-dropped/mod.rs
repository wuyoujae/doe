// Origin: app/backend/core/src/slide_recovery/tests.rs::conflicting_unknown_fields_are_not_silently_dropped
use super::*;


#[test]
pub(super) fn conflicting_unknown_fields_are_not_silently_dropped() {
    let mut slide = valid_slide("slide-1", "Unknown business field");
    slide["businessPayload"] = json!({"mustKeep": true});
    let raw = deck(vec![slide]).to_string();

    let error = recover_agent_deck(&raw, expectations(1), &[])
        .expect_err("unknown business data must not be discarded");
    assert!(error.contains("businessPayload is not allowed"), "{error}");
}

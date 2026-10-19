// Origin: app/backend/core/src/slide_recovery/tests.rs::disabled_recovery_accepts_only_semantically_unchanged_valid_json
use super::*;


#[test]
pub(super) fn disabled_recovery_accepts_only_semantically_unchanged_valid_json() {
    let valid = deck(vec![valid_slide("slide-1", "Strict")]);
    assert!(accept_original_agent_deck(&valid.to_string(), expectations(1), &[]).is_ok());

    let mut legacy = valid;
    legacy.as_object_mut().unwrap().remove("pageNumber");
    let error = accept_original_agent_deck(&legacy.to_string(), expectations(1), &[])
        .expect_err("disabled recovery must not hide parser normalization");
    assert_eq!(
        error,
        "slide_recovery_disabled_candidate_requires_normalization"
    );
}

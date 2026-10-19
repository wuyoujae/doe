// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::disabled_v2_does_not_strip_a_fence
use super::*;


#[test]
pub(super) fn disabled_v2_does_not_strip_a_fence() {
    let raw = valid_deck(r#""disabled""#);
    let error = process_one(&format!("```json\n{raw}\n```"), false).unwrap_err();
    assert!(error.starts_with(crate::presentation::schema::contract::INVALID_JSON_ERROR));
}

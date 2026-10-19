// Origin: app/backend/core/src/outline_recovery/compiler/tests.rs::rejects_duplicate_keys_before_dom_last_value_wins
use super::*;


#[test]
pub(super) fn rejects_duplicate_keys_before_dom_last_value_wins() {
    let error = compile_json(r#"{"a":1,"a":2}"#, |_| Some(0)).unwrap_err();
    assert!(error.contains("duplicate object key"));
}

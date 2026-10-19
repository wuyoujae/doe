// Origin: app/backend/core/src/outline_recovery/compiler/tests.rs::closes_complete_containers_at_eof_but_not_missing_values
use super::*;


#[test]
pub(super) fn closes_complete_containers_at_eof_but_not_missing_values() {
    let compiled = compile_json(r#"{"a":[1,2"#, |_| Some(0)).expect("close containers");
    assert_eq!(compiled.value["a"], serde_json::json!([1, 2]));
    assert!(compile_json(r#"{"a":"#, |_| Some(0)).is_err());
}

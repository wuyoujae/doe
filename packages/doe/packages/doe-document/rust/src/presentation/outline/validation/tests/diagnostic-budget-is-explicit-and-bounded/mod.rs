// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::diagnostic_budget_is_explicit_and_bounded
use super::*;


#[test]
pub(super) fn diagnostic_budget_is_explicit_and_bounded() {
    let mut v = sample();
    v["body"][0]["contents"] = json!(vec![Value::Null; 100]);
    let e = errors(&v);
    assert_eq!(e.issues.len(), MAX_ISSUES);
    assert!(e.truncated);
}

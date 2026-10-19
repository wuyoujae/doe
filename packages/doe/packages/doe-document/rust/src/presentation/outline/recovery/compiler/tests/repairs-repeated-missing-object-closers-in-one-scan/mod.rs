// Origin: app/backend/core/src/outline_recovery/compiler/tests.rs::repairs_repeated_missing_object_closers_in_one_scan
use super::*;


#[test]
pub(super) fn repairs_repeated_missing_object_closers_in_one_scan() {
    let raw = r#"{"slides":[{"page":1,"contents":{"a":"一"},{"page":2,"contents":{"a":"二"},{"page":3,"contents":{"a":"三"}}]}"#;
    let compiled = compile_json(raw, |_| Some(0)).expect("compile repeated corruption");
    assert_eq!(compiled.value["slides"].as_array().unwrap().len(), 3);
    assert_eq!(compiled.proof.edits.len(), 2);
    assert!(compiled.proof.business_string_invariant_passed);
    assert_eq!(
        compiled.diagnostics.findings[0].multiplicity,
        "homogeneous_repeated"
    );
}

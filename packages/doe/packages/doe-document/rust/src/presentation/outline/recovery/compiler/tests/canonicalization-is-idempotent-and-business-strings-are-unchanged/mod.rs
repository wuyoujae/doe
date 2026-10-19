// Origin: app/backend/core/src/outline_recovery/compiler/tests.rs::canonicalization_is_idempotent_and_business_strings_are_unchanged
use super::*;


#[test]
pub(super) fn canonicalization_is_idempotent_and_business_strings_are_unchanged() {
    let raw = "```json\n{\"items\":[{\"name\":\"杰哥，内容不变\"}]}\n```";
    let compiled = compile_json(raw, |_| Some(0)).expect("compile fenced JSON");
    assert!(compiled.proof.canonicalization_idempotent);
    assert!(compiled.proof.business_string_invariant_passed);
    assert_eq!(compiled.value["items"][0]["name"], "杰哥，内容不变");
}

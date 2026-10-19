// Origin: app/backend/core/src/outline_recovery/compiler/tests.rs::inserts_a_missing_member_comma_without_reinterpreting_the_next_key
use super::*;


#[test]
pub(super) fn inserts_a_missing_member_comma_without_reinterpreting_the_next_key() {
    let compiled =
        compile_json(r#"{"body":null"src":"x"}"#, |_| Some(0)).expect("insert member comma");
    assert_eq!(compiled.value["src"], "x");
    assert_eq!(compiled.proof.edits.len(), 1);
}

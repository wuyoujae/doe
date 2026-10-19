// Origin: app/backend/core/src/slide_recovery/tests.rs::equal_duplicate_keys_are_repaired_but_conflicting_duplicates_fail_closed
use super::*;


#[test]
pub(super) fn equal_duplicate_keys_are_repaired_but_conflicting_duplicates_fail_closed() {
    let raw = deck(vec![valid_slide("slide-1", "Duplicate")]).to_string();
    let equal = raw.replacen(r#""version":4"#, r#""version":4,"version":4"#, 1);
    let repaired = recover_agent_deck(&equal, expectations(1), &[]).unwrap();
    assert_eq!(repaired.proof.edits[0].code, "json.equal_duplicate_key");
    assert_eq!(repaired.parsed.version, 4);

    let conflicting = raw.replacen(r#""version":4"#, r#""version":4,"version":3"#, 1);
    let error = recover_agent_deck(&conflicting, expectations(1), &[])
        .expect_err("conflicting duplicate keys are ambiguous");
    assert!(error.starts_with("slide_agent_ambiguous_duplicate_key"));
}

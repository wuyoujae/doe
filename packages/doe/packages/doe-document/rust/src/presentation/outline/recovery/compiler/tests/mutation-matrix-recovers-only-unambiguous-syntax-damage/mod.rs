// Origin: app/backend/core/src/outline_recovery/compiler/tests.rs::mutation_matrix_recovers_only_unambiguous_syntax_damage
use super::*;


#[test]
pub(super) fn mutation_matrix_recovers_only_unambiguous_syntax_damage() {
    let recoverable = [
        ("omit", r#"{"a":1 "b":2}"#),
        ("insert", r#"{"a":1,}"#),
        ("substitute", r#"{"a" 1}"#),
        ("wrap", "```json\n{\"a\":1}\n```"),
        ("escape_damage", "{\"a\":\"line\nvalue\"}"),
    ];
    for (mutation, raw) in recoverable {
        let compiled = compile_json(raw, |_| Some(0))
            .unwrap_or_else(|error| panic!("{mutation} should recover: {error}"));
        assert!(compiled.proof.business_string_invariant_passed);
        assert!(compiled.proof.canonicalization_idempotent);
    }

    let ambiguous_or_lossy = [
        ("duplicate", r#"{"a":1,"a":2}"#),
        ("transpose", r#"{"a":1}{"b":2}"#),
        ("truncate", r#"{"a":"#),
    ];
    for (mutation, raw) in ambiguous_or_lossy {
        assert!(
            compile_json(raw, |_| Some(0)).is_err(),
            "{mutation} must escalate instead of guessing"
        );
    }
}

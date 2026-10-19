// Origin: app/backend/core/src/slide_recovery/tests.rs::json_fence_and_unique_syntax_damage_are_repaired_only_on_recovery_path
use super::*;


#[test]
pub(super) fn json_fence_and_unique_syntax_damage_are_repaired_only_on_recovery_path() {
    let value = deck(vec![valid_slide("slide-1", "Fenced")]);
    let raw = format!("```json\n{}\n```", value);
    assert!(
        slide_agent_output_contract::parse_and_validate_agent_deck(&raw, expectations(1), &[])
            .is_err()
    );

    let outcome = recover_agent_deck(&raw, expectations(1), &[]).unwrap();
    assert_eq!(
        outcome.proof.disposition,
        SlideRecoveryDisposition::DeterministicRepair
    );
    assert_eq!(outcome.proof.edits[0].code, "json.unique_embedded_object");
}

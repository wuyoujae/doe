// Origin: app/backend/core/src/slide_recovery/tests.rs::parser_normalizations_are_audited_as_deterministic_repairs
use super::*;


#[test]
pub(super) fn parser_normalizations_are_audited_as_deterministic_repairs() {
    let mut legacy = deck(vec![valid_slide("slide-1", "Legacy")]);
    legacy.as_object_mut().unwrap().remove("pageNumber");
    legacy["deck"]["size"] = json!({"width": 960, "height": 540, "unit": "pt"});
    legacy["deck"]["slides"][0]["blocks"][0]["slotSpace"] = json!({"bottom": "12pt"});

    let outcome = recover_agent_deck(&legacy.to_string(), expectations(1), &[]).unwrap();
    let repaired: Value = serde_json::from_str(&outcome.parsed.canonical_json).unwrap();
    assert_eq!(
        outcome.proof.disposition,
        SlideRecoveryDisposition::DeterministicRepair
    );
    assert_eq!(outcome.proof.edits.len(), 1);
    assert_eq!(outcome.proof.edits[0].code, "contract.normalization_unique");
    assert_eq!(
        repaired["pageNumber"],
        json!({"enabled": true, "format": "number"})
    );
    assert!(repaired["deck"].get("size").is_none());
    assert!(repaired["deck"]["slides"][0]["blocks"][0]
        .get("slotSpace")
        .is_none());
    assert_eq!(
        repaired["deck"]["slides"][0]["blocks"][0]["layout"]["slotSpace"]["bottom"],
        "12pt"
    );
}

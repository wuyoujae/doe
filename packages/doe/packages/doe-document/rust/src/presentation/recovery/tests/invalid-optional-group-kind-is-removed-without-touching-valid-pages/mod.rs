// Origin: app/backend/core/src/slide_recovery/tests.rs::invalid_optional_group_kind_is_removed_without_touching_valid_pages
use super::*;


#[test]
pub(super) fn invalid_optional_group_kind_is_removed_without_touching_valid_pages() {
    let first = valid_slide("slide-1", "Frozen page");
    let first_hash = canonical_value_sha256(&first);
    let mut second = valid_slide("slide-2", "Repair page");
    second["blocks"] = json!([{
        "id": "group-2",
        "type": "layout-group",
        "kind": "composition",
        "layout": {"variant": "edge-media"},
        "children": [{
            "id": "slide-2-heading",
            "type": "heading",
            "props": {"text": "Repair page"}
        }]
    }]);
    let outcome =
        recover_agent_deck(&deck(vec![first, second]).to_string(), expectations(2), &[]).unwrap();
    let repaired: Value = serde_json::from_str(&outcome.parsed.canonical_json).unwrap();

    assert_eq!(
        outcome.proof.disposition,
        SlideRecoveryDisposition::DeterministicRepair
    );
    assert!(repaired["deck"]["slides"][1]["blocks"][0]
        .get("kind")
        .is_none());
    assert_eq!(
        canonical_value_sha256(&repaired["deck"]["slides"][0]),
        first_hash
    );
    assert_eq!(outcome.proof.frozen_slides.len(), 1);
    assert_eq!(outcome.proof.edits.len(), 1);
    assert_eq!(
        outcome.proof.edits[0].code,
        "contract.invalid_optional_control"
    );
}

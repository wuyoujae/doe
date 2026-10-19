// Origin: app/backend/core/src/slide_recovery/tests.rs::diagnostics_collect_multiple_contract_failures_before_repair
use super::*;


#[test]
pub(super) fn diagnostics_collect_multiple_contract_failures_before_repair() {
    let mut slide = valid_slide("slide-1", "Collect all");
    slide["blocks"] = json!([{
        "id": "group-1",
        "type": "layout-group",
        "kind": "composition",
        "props": {},
        "layout": {"variant": "stack"},
        "children": [{
            "id": "heading-1",
            "type": "heading",
            "props": {"text": "Collect all"}
        }]
    }]);
    let outcome = recover_agent_deck(&deck(vec![slide]).to_string(), expectations(1), &[]).unwrap();
    let codes = outcome
        .proof
        .diagnostics
        .iter()
        .map(|finding| finding.code.as_str())
        .collect::<HashSet<_>>();

    assert!(codes.contains("schema.enum"));
    assert!(codes.contains("schema.unknown_field"));
    assert_eq!(outcome.proof.edits.len(), 2);
}

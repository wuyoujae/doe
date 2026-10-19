// Origin: app/backend/core/src/slide_recovery/tests.rs::accepted_renderer_proof_is_attached_without_changing_canonical_deck
use super::*;


#[test]
pub(super) fn accepted_renderer_proof_is_attached_without_changing_canonical_deck() {
    let value = deck(vec![valid_slide("slide-1", "Accepted")]);
    let recovered = recover_agent_deck(&value.to_string(), expectations(1), &[]).unwrap();
    let canonical = recovered.parsed.canonical_json.clone();
    let report = SlideRenderGateReport {
        success: true,
        contract: "yrkie-slide-repair-render-gate-v1".to_string(),
        pages: vec![render_page(0, true)],
    };

    let recovered = accept_render_validation(recovered, report).unwrap();
    assert_eq!(recovered.parsed.canonical_json, canonical);
    assert!(recovered.proof.render_validation.is_some());
}

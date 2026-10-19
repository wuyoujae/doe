// Origin: app/backend/core/src/slide_recovery/tests.rs::renderer_rejection_becomes_a_hash_bound_page_plan_and_freezes_other_pages
use super::*;


#[test]
pub(super) fn renderer_rejection_becomes_a_hash_bound_page_plan_and_freezes_other_pages() {
    let value = deck(vec![
        valid_slide("slide-1", "Frozen"),
        valid_slide("slide-2", "Overflow"),
    ]);
    let recovered = recover_agent_deck(&value.to_string(), expectations(2), &[]).unwrap();
    let first_hash = canonical_value_sha256(&recovered.parsed.slides[0]);
    let mut rejected_page = render_page(1, false);
    let rejected_layout = rejected_page.report.as_mut().unwrap();
    rejected_layout.overflow_y = 0;
    rejected_layout.compression_fit_violations = 1;
    let report = SlideRenderGateReport {
        success: false,
        contract: "yrkie-slide-repair-render-gate-v1".to_string(),
        pages: vec![render_page(0, true), rejected_page],
    };

    let plan = plan_render_page_repairs(&recovered, &report).unwrap();
    assert_eq!(plan.targets.len(), 1);
    assert_eq!(plan.targets[0].page_index, 1);
    assert_eq!(
        plan.targets[0].page_sha256,
        canonical_value_sha256(&recovered.parsed.slides[1])
    );
    assert_eq!(plan.frozen_slides.len(), 1);
    assert_eq!(plan.frozen_slides[0].page_index, 0);
    assert_eq!(plan.frozen_slides[0].before_sha256, first_hash);
    assert!(plan.targets[0]
        .diagnostics
        .iter()
        .any(|finding| finding.code == "renderer.layout_rejected"));
    assert!(plan.targets[0]
        .diagnostics
        .iter()
        .any(|finding| finding.code == "renderer.compression_fit"));
}

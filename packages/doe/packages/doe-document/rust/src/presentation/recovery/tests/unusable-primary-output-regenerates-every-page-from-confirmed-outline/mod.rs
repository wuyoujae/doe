// Origin: app/backend/core/src/slide_recovery/tests.rs::unusable_primary_output_regenerates_every_page_from_confirmed_outline
use super::*;


#[test]
pub(super) fn unusable_primary_output_regenerates_every_page_from_confirmed_outline() {
    let context = json!({
        "confirmed_outline": {"outline": {
            "title": "年度经营复盘",
            "slides": [
                {"page_number": 1, "contents": {"title": {"body": "年度经营成果"}}},
                {"page_number": 2, "contents": {"title": {"body": "下一年度重点"}}}
            ]
        }}
    });
    let title = model_io::grounded_deck_title(&context).unwrap();
    let plan = plan_full_page_regeneration("not-json", expectations(2), &title).unwrap();
    assert_eq!(plan.targets.len(), 2);
    assert!(plan.frozen_slides.is_empty());
    assert!(plan.targets.iter().all(|target| target
        .diagnostics
        .iter()
        .any(|finding| finding.code == "recovery.full_page_regeneration_required")));

    let replacements =
        model_io::deterministic_minimal_fallback_replacements(&plan, &context).unwrap();
    let recovered = apply_page_replacements(
        &plan,
        &replacements,
        expectations(2),
        &[],
        SlideRecoveryDisposition::DeterministicFallback,
    )
    .unwrap();
    assert_eq!(recovered.parsed.title, "年度经营复盘");
    assert_eq!(recovered.parsed.slides.len(), 2);
    assert!(grounding::evaluate(&recovered, &context).unwrap().success);
    assert!(!recovered.parsed.canonical_json.contains("Recovery staging"));
}

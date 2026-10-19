// Origin: app/backend/core/src/slide_recovery/tests.rs::ungrounded_page_is_replaced_from_outline_without_touching_grounded_page
use super::*;


#[test]
pub(super) fn ungrounded_page_is_replaced_from_outline_without_touching_grounded_page() {
    let recovered = recover_agent_deck(
        &deck(vec![
            valid_slide("slide-1", "第一页经营成果"),
            valid_slide("slide-2", "完全无关的内容"),
        ])
        .to_string(),
        expectations(2),
        &[],
    )
    .unwrap();
    let frozen_hash = canonical_value_sha256(&recovered.parsed.slides[0]);
    let context = json!({
        "confirmed_outline": {"outline": {"slides": [
            {"page_number": 1, "contents": {"title": {"body": "第一页经营成果"}}},
            {"page_number": 2, "contents": {"title": {"body": "第二页战略重点"}}}
        ]}}
    });
    let report = grounding::evaluate(&recovered, &context).unwrap();
    assert!(!report.success);
    let plan = plan_grounding_page_repairs(&recovered, &report).unwrap();
    assert_eq!(plan.targets.len(), 1);
    assert_eq!(plan.targets[0].page_index, 1);

    let replacements =
        model_io::deterministic_minimal_fallback_replacements(&plan, &context).unwrap();
    let repaired = apply_page_replacements(
        &plan,
        &replacements,
        expectations(2),
        &[],
        SlideRecoveryDisposition::DeterministicFallback,
    )
    .unwrap();
    assert_eq!(
        canonical_value_sha256(&repaired.parsed.slides[0]),
        frozen_hash
    );
    assert!(grounding::evaluate(&repaired, &context).unwrap().success);
}

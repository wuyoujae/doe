// Origin: app/backend/core/src/slide_recovery/tests.rs::page_repair_plan_freezes_valid_pages_and_accepts_only_hash_bound_targets
use super::*;


#[test]
pub(super) fn page_repair_plan_freezes_valid_pages_and_accepts_only_hash_bound_targets() {
    let first = valid_slide("slide-1", "Frozen");
    let first_hash = canonical_value_sha256(&first);
    let mut broken = valid_slide("slide-2", "Broken");
    broken["blocks"][0]["props"] = json!({});
    let raw = deck(vec![first, broken]).to_string();
    let plan = plan_page_repairs(&raw, expectations(2), &[]).unwrap();

    assert_eq!(plan.targets.len(), 1);
    assert_eq!(plan.targets[0].page_index, 1);
    assert_eq!(plan.frozen_slides.len(), 1);
    assert_eq!(plan.frozen_slides[0].before_sha256, first_hash);

    let replacement = SlidePageReplacement {
        page_index: 1,
        expected_page_sha256: plan.targets[0].page_sha256.clone(),
        slide: valid_slide("slide-2", "Repaired from Outline"),
    };
    let outcome = apply_page_replacements(
        &plan,
        std::slice::from_ref(&replacement),
        expectations(2),
        &[],
        SlideRecoveryDisposition::AiPageRepair,
    )
    .unwrap();
    let repaired: Value = serde_json::from_str(&outcome.parsed.canonical_json).unwrap();
    assert_eq!(
        outcome.proof.disposition,
        SlideRecoveryDisposition::AiPageRepair
    );
    assert_eq!(
        canonical_value_sha256(&repaired["deck"]["slides"][0]),
        first_hash
    );

    let stale = SlidePageReplacement {
        expected_page_sha256: "0".repeat(64),
        ..replacement
    };
    let error = apply_page_replacements(
        &plan,
        &[stale],
        expectations(2),
        &[],
        SlideRecoveryDisposition::AiPageRepair,
    )
    .expect_err("stale patch must fail closed");
    assert!(error.starts_with("slide_recovery_stale_patch"));
}

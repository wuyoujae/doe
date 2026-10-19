// Origin: app/backend/core/src/slide_recovery/mod.rs::plan_grounding_page_repairs
use super::*;


pub fn plan_grounding_page_repairs(
    recovered: &RecoveredSlideDeck,
    report: &grounding::SlideGroundingProof,
) -> Result<SlidePageRepairPlan, String> {
    if report.success || report.pages.iter().all(|page| page.accepted) {
        return Err(
            "slide_recovery_grounding_page_plan_not_required: every page is grounded".to_string(),
        );
    }
    if report.pages.len() != recovered.parsed.slides.len()
        || report
            .pages
            .iter()
            .enumerate()
            .any(|(index, page)| page.page_index != index)
    {
        return Err("slide_recovery_grounding_page_count_mismatch".to_string());
    }
    let failed_indices = report
        .pages
        .iter()
        .filter(|page| !page.accepted)
        .map(|page| page.page_index)
        .collect::<BTreeSet<_>>();
    let mut diagnostics = recovered.proof.diagnostics.clone();
    diagnostics.extend(grounding::rejected_diagnostics(report));
    diagnostics.sort_by(|left, right| {
        left.page_index
            .cmp(&right.page_index)
            .then_with(|| left.path.cmp(&right.path))
            .then_with(|| left.code.cmp(&right.code))
    });
    diagnostics.dedup();
    plan_valid_candidate_page_repairs(recovered, &failed_indices, diagnostics)
}

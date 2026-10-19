// Origin: app/backend/core/src/slide_recovery/mod.rs::accept_grounding_validation
use super::*;


pub fn accept_grounding_validation(
    mut recovered: RecoveredSlideDeck,
    report: grounding::SlideGroundingProof,
) -> Result<RecoveredSlideDeck, String> {
    if !report.success
        || report.pages.len() != recovered.parsed.slides.len()
        || report.pages.iter().any(|page| !page.accepted)
    {
        return Err("slide_recovery_grounding_rejected".to_string());
    }
    recovered.proof.grounding_validation = Some(report);
    Ok(recovered)
}

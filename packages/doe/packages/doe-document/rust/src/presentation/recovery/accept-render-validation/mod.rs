// Origin: app/backend/core/src/slide_recovery/mod.rs::accept_render_validation
use super::*;


pub fn accept_render_validation(
    mut recovered: RecoveredSlideDeck,
    report: render_gate::SlideRenderGateReport,
) -> Result<RecoveredSlideDeck, String> {
    if !report.success
        || report.pages.len() != recovered.parsed.slides.len()
        || report.pages.iter().any(|page| !page.accepted)
    {
        return Err(render_gate::render_rejection(&report));
    }
    recovered.proof.render_validation = Some(report);
    Ok(recovered)
}

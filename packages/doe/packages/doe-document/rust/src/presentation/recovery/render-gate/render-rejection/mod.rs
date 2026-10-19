// Origin: app/backend/core/src/slide_recovery/render_gate.rs::render_rejection
use super::*;


pub fn render_rejection(report: &SlideRenderGateReport) -> String {
    let pages = report
        .pages
        .iter()
        .filter(|page| !page.accepted)
        .map(|page| {
            format!(
                "{}:{}:{}:{}",
                page.page_index,
                page.deterministic,
                page.hard_diagnostics.join("|"),
                page.repair_diagnostics.join("|")
            )
        })
        .collect::<Vec<_>>()
        .join(",");
    format!("slide_recovery_render_gate_rejected: {pages}")
}

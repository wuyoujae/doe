// Origin: app/backend/core/src/slide_recovery/render_gate.rs::validate_report
use super::*;


pub fn validate_report(report: &SlideRenderGateReport) -> Result<(), String> {
    if report.contract != RENDER_GATE_CONTRACT
        || report.pages.is_empty()
        || report
            .pages
            .iter()
            .enumerate()
            .any(|(index, page)| page.page_index != index || !valid_page_report(page))
    {
        return Err("slide_recovery_render_gate_contract_mismatch".to_string());
    }
    let rejected = report.pages.iter().any(|page| !page.accepted);
    if report.success == rejected {
        return Err("slide_recovery_render_gate_contract_mismatch".to_string());
    }
    Ok(())
}

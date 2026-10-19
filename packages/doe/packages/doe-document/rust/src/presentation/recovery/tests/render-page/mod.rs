// Origin: app/backend/core/src/slide_recovery/tests.rs::render_page
use super::*;


pub(super) fn render_page(page_index: usize, accepted: bool) -> SlideRenderGatePage {
    SlideRenderGatePage {
        page_index,
        deterministic: true,
        compiled_sha256: format!("{:064x}", page_index + 1),
        hard_diagnostics: Vec::new(),
        repair_diagnostics: Vec::new(),
        adaptive_diagnostics: Vec::new(),
        business_preserved: true,
        missing_business_facts: 0,
        source_business_sha256: format!("{:064x}", page_index + 101),
        compiled_business_sha256: format!("{:064x}", page_index + 201),
        report: Some(SlideRenderLayoutReport {
            fits: accepted,
            overflow_x: 0,
            overflow_y: u64::from(!accepted),
            overlaps: 0,
            min_width_violations: 0,
            min_height_violations: 0,
            compression_fit_violations: 0,
            semantic_wrap_violations: 0,
            min_font_violations: 0,
        }),
        accepted,
    }
}

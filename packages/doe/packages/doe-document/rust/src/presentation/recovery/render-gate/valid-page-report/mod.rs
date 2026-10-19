// Origin: app/backend/core/src/slide_recovery/render_gate.rs::valid_page_report
use super::*;


pub(super) fn valid_page_report(page: &SlideRenderGatePage) -> bool {
    let valid_hash = |value: &str| {
        value.len() == 64
            && value
                .bytes()
                .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
    };
    let valid_layout = page.report.as_ref().is_some_and(|report| {
        report.fits
            && report.overflow_x == 0
            && report.overflow_y == 0
            && report.overlaps == 0
            && report.min_width_violations == 0
            && report.min_height_violations == 0
            && report.compression_fit_violations == 0
            && report.semantic_wrap_violations == 0
            && report.min_font_violations == 0
    });
    let expected_accepted = page.deterministic
        && page.hard_diagnostics.is_empty()
        && page.repair_diagnostics.is_empty()
        && page.business_preserved
        && page.missing_business_facts == 0
        && valid_layout;
    let diagnostic_sets_are_disjoint = page.adaptive_diagnostics.iter().all(|code| {
        ACCEPTED_ADAPTIVE_DIAGNOSTICS.contains(&code.as_str())
            && !page.repair_diagnostics.contains(code)
    }) && page
        .repair_diagnostics
        .iter()
        .all(|code| !ACCEPTED_ADAPTIVE_DIAGNOSTICS.contains(&code.as_str()));
    valid_hash(&page.compiled_sha256)
        && valid_hash(&page.source_business_sha256)
        && valid_hash(&page.compiled_business_sha256)
        && diagnostic_sets_are_disjoint
        && page.accepted == expected_accepted
}

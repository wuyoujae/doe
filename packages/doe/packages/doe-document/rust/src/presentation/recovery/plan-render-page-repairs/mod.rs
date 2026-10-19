// Origin: app/backend/core/src/slide_recovery/mod.rs::plan_render_page_repairs
use super::*;


pub fn plan_render_page_repairs(
    recovered: &RecoveredSlideDeck,
    report: &render_gate::SlideRenderGateReport,
) -> Result<SlidePageRepairPlan, String> {
    if report.success || report.pages.iter().all(|page| page.accepted) {
        return Err(
            "slide_recovery_render_page_plan_not_required: renderer accepted every page"
                .to_string(),
        );
    }
    if report.pages.len() != recovered.parsed.slides.len()
        || report
            .pages
            .iter()
            .enumerate()
            .any(|(index, page)| page.page_index != index)
    {
        return Err("slide_recovery_render_page_count_mismatch".to_string());
    }

    let failed_indices = report
        .pages
        .iter()
        .filter(|page| !page.accepted)
        .map(|page| page.page_index)
        .collect::<BTreeSet<_>>();
    let mut diagnostics = recovered.proof.diagnostics.clone();
    for page in report.pages.iter().filter(|page| !page.accepted) {
        let path = format!("root.deck.slides[{}]", page.page_index);
        if !page.deterministic {
            diagnostics.push(render_diagnostic(
                "renderer.nondeterministic",
                &path,
                "two isolated renders produced different compiled slide hashes",
                page.page_index,
            ));
        }
        for code in &page.hard_diagnostics {
            diagnostics.push(render_diagnostic(
                "renderer.hard_diagnostic",
                &path,
                &format!("renderer diagnostic code: {code}"),
                page.page_index,
            ));
        }
        for code in &page.repair_diagnostics {
            diagnostics.push(render_diagnostic(
                "renderer.silent_repair",
                &path,
                &format!("renderer attempted an implicit repair: {code}"),
                page.page_index,
            ));
        }
        if let Some(layout) = page.report.as_ref() {
            if !layout.fits {
                diagnostics.push(render_diagnostic(
                    "renderer.layout_not_fit",
                    &path,
                    "renderer could not find a layout satisfying every hard fit constraint",
                    page.page_index,
                ));
            }
            let mut metric = |code: &str, count: u64, label: &str| {
                if count != 0 {
                    diagnostics.push(render_diagnostic(
                        code,
                        &path,
                        &format!("renderer measured {count} {label}"),
                        page.page_index,
                    ));
                }
            };
            metric(
                "renderer.overflow_x",
                layout.overflow_x,
                "horizontal overflow pixels",
            );
            metric(
                "renderer.overflow_y",
                layout.overflow_y,
                "vertical overflow pixels",
            );
            metric(
                "renderer.overlap",
                layout.overlaps,
                "overlapping sibling pairs",
            );
            metric(
                "renderer.min_width",
                layout.min_width_violations,
                "components below their minimum width",
            );
            metric(
                "renderer.min_height",
                layout.min_height_violations,
                "components below their minimum height",
            );
            metric(
                "renderer.compression_fit",
                layout.compression_fit_violations,
                "composition groups that cannot satisfy their compression contract",
            );
            metric(
                "renderer.semantic_wrap",
                layout.semantic_wrap_violations,
                "blocked semantic text wraps",
            );
            metric(
                "renderer.min_font",
                layout.min_font_violations,
                "text runs below their minimum font size",
            );
        } else {
            diagnostics.push(render_diagnostic(
                "renderer.layout_report_missing",
                &path,
                "renderer did not return a layout measurement report for this page",
                page.page_index,
            ));
        }
        if page.report.as_ref().is_none_or(|layout| {
            !layout.fits
                || layout.overflow_x != 0
                || layout.overflow_y != 0
                || layout.overlaps != 0
                || layout.min_width_violations != 0
                || layout.min_height_violations != 0
                || layout.compression_fit_violations != 0
                || layout.semantic_wrap_violations != 0
                || layout.min_font_violations != 0
        }) {
            diagnostics.push(render_diagnostic(
                "renderer.layout_rejected",
                &path,
                "rendered page does not satisfy the complete layout fit contract",
                page.page_index,
            ));
        }
    }
    diagnostics.sort_by(|left, right| {
        left.page_index
            .cmp(&right.page_index)
            .then_with(|| left.path.cmp(&right.path))
            .then_with(|| left.code.cmp(&right.code))
    });
    diagnostics.dedup();

    plan_valid_candidate_page_repairs(recovered, &failed_indices, diagnostics)
}

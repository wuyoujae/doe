// Origin: app/backend/core/src/slide_recovery/grounding.rs::rejected_diagnostics
use super::*;


pub fn rejected_diagnostics(report: &SlideGroundingProof) -> Vec<SlideDiagnostic> {
    report
        .pages
        .iter()
        .filter(|page| !page.accepted)
        .flat_map(|page| {
            let mut diagnostics = Vec::new();
            if page.outline_anchor_count == 0
                || page.slide_anchor_count == 0
                || page.shared_anchor_count == 0
            {
                diagnostics.push(render_diagnostic(
                    "outline.page_ungrounded",
                    &format!("root.deck.slides[{}]", page.page_index),
                    "page contains no exact normalized semantic anchor from its confirmed Outline page",
                    page.page_index,
                ));
            }
            if page.unsupported_number_count > 0
                || page.unsupported_url_count > 0
                || page.unsupported_attribution_count > 0
            {
                diagnostics.push(render_diagnostic(
                    "outline.page_fact_unsupported",
                    &format!("root.deck.slides[{}]", page.page_index),
                    "page contains a number, URL, source, or quotation absent from the confirmed task inputs",
                    page.page_index,
                ));
            }
            diagnostics
        })
        .collect()
}

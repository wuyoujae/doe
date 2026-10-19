// Origin: app/backend/core/src/slide_recovery/mod.rs::collect_diagnostics
use super::*;


pub(super) fn collect_diagnostics(
    candidate: &Value,
    expectations: SlideDeckExpectations,
) -> Vec<SlideDiagnostic> {
    let mut diagnostics = Vec::new();
    let schema_format = slide_agent_output_contract::response_format(expectations);
    collect_schema_diagnostics(
        candidate,
        &schema_format["json_schema"]["schema"],
        "root",
        None,
        &mut diagnostics,
    );
    collect_relation_diagnostics(candidate, &mut diagnostics);
    if diagnostics.is_empty() {
        if let Err(error) =
            slide_agent_output_contract::validate_deck_value(candidate, expectations)
        {
            diagnostics.push(diagnostic_from_error(&error, None));
        }
    }
    if let Some(slides) = candidate_slides(candidate) {
        for (page_index, slide) in slides.iter().enumerate() {
            if !diagnostics
                .iter()
                .any(|finding| finding.page_index == Some(page_index))
            {
                if let Err(error) =
                    slide_agent_output_contract::validate_slide_value(slide, page_index)
                {
                    diagnostics.push(diagnostic_from_error(&error, Some(page_index)));
                }
            }
        }
    }
    diagnostics
}

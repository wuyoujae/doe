// Origin: app/backend/core/src/slide_recovery/mod.rs::push_schema_diagnostic
use super::*;


pub(super) fn push_schema_diagnostic(
    diagnostics: &mut Vec<SlideDiagnostic>,
    code: &str,
    path: &str,
    message: &str,
    page_index: Option<usize>,
    repairability: SlideRepairability,
) {
    diagnostics.push(SlideDiagnostic {
        code: code.to_string(),
        path: path.to_string(),
        message: message.to_string(),
        page_index,
        repairability,
    });
}

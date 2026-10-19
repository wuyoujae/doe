// Origin: app/backend/core/src/slide_recovery/mod.rs::push_relation_diagnostic
use super::*;


pub(super) fn push_relation_diagnostic(
    diagnostics: &mut Vec<SlideDiagnostic>,
    code: &str,
    path: &str,
    message: &str,
    page_index: usize,
) {
    push_schema_diagnostic(
        diagnostics,
        code,
        path,
        message,
        Some(page_index),
        SlideRepairability::RequiresPageRepair,
    );
}

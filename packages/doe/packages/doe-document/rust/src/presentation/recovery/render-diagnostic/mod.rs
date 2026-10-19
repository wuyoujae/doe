// Origin: app/backend/core/src/slide_recovery/mod.rs::render_diagnostic
use super::*;


pub(super) fn render_diagnostic(code: &str, path: &str, message: &str, page_index: usize) -> SlideDiagnostic {
    SlideDiagnostic {
        code: code.to_string(),
        path: path.to_string(),
        message: message.to_string(),
        page_index: Some(page_index),
        repairability: SlideRepairability::RequiresPageRepair,
    }
}

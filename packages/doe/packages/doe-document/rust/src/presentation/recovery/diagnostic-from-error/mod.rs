// Origin: app/backend/core/src/slide_recovery/mod.rs::diagnostic_from_error
use super::*;


pub(super) fn diagnostic_from_error(error: &str, page_index: Option<usize>) -> SlideDiagnostic {
    let message = error
        .split_once(": ")
        .map_or(error, |(_, message)| message)
        .to_string();
    let path = message
        .split_whitespace()
        .next()
        .filter(|value| value.starts_with("root"))
        .unwrap_or("root")
        .trim_end_matches(':')
        .to_string();
    let (code, repairability) = if error.starts_with(INVALID_JSON_ERROR) {
        ("json.invalid", SlideRepairability::GrammarUnique)
    } else if message.contains(" is invalid")
        || message.contains(" must equal ")
        || message.contains(" is not allowed")
    {
        ("contract.invalid_value", SlideRepairability::ContractUnique)
    } else {
        (
            "contract.page_repair_required",
            SlideRepairability::RequiresPageRepair,
        )
    };
    SlideDiagnostic {
        code: code.to_string(),
        path,
        message,
        page_index: page_index.or_else(|| page_index_from_path(error)),
        repairability,
    }
}

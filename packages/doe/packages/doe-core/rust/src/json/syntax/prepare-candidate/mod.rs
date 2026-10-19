// Origin: app/backend/core/src/json_syntax_repair.rs::prepare_candidate
use super::*;


pub(super) fn prepare_candidate(raw: &str) -> (String, JsonSyntaxRepairReport) {
    let mut report = JsonSyntaxRepairReport::default();
    let unwrapped = unwrap_single_markdown_json_fence(raw);
    let mut candidate = unwrapped.unwrap_or(raw).to_string();
    if unwrapped.is_some() {
        report.edits.push(JsonSyntaxRepairEdit {
            kind: JsonSyntaxRepairKind::UnwrapMarkdownFence,
            byte_offset: 0,
            scope: "value".to_string(),
        });
    }

    if let Some(offset) = candidate.find('\u{feff}') {
        if candidate[..offset].chars().all(char::is_whitespace) {
            candidate.remove(offset);
            report.edits.push(JsonSyntaxRepairEdit {
                kind: JsonSyntaxRepairKind::RemoveBom,
                byte_offset: offset,
                scope: "value".to_string(),
            });
        }
    }
    (candidate, report)
}

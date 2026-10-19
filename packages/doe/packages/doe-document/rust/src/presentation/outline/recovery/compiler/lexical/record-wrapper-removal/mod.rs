// Origin: app/backend/core/src/outline_recovery/compiler/lexical.rs::record_wrapper_removal
use super::*;


pub(super) fn record_wrapper_removal(
    raw: &str,
    span: SourceSpan,
    findings: &mut Vec<DiagnosticFinding>,
    edits: &mut Vec<RepairEdit>,
) {
    if span.start >= span.end || raw[span.start..span.end].trim().is_empty() {
        return;
    }
    let removed = &raw.as_bytes()[span.start..span.end];
    findings.push(DiagnosticFinding {
        code: "framing.wrapper.removed".to_string(),
        stage: RecoveryStage::S4,
        invariant: "single_json_document".to_string(),
        mutation: "wrap".to_string(),
        scope: "complete_outline_output".to_string(),
        multiplicity: "single".to_string(),
        ambiguity: Ambiguity::A0,
        severity: FindingSeverity::Warning,
        json_pointer: String::new(),
        source_byte_start: Some(span.start),
        source_byte_end: Some(span.end),
        expected: "one uniquely bounded JSON document".to_string(),
        actual: "non-JSON framing outside the unique document".to_string(),
        evidence_hash: sha256_hex(removed),
        constraint_id: Some("json.framing.remove_unique_wrapper".to_string()),
    });
    edits.push(RepairEdit {
        operation: "remove_wrapper".to_string(),
        source_byte_start: span.start,
        source_byte_end: span.end,
        token: Some(String::new()),
        target_pointer: String::new(),
        before_hash: sha256_hex(removed),
        after_hash: sha256_hex(b""),
        constraint_id: "json.framing.remove_unique_wrapper".to_string(),
        ambiguity: Ambiguity::A0,
    });
}

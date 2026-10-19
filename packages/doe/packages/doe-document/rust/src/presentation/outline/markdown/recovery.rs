use super::*;
use crate::presentation::outline::{
    authoring::ParsedOutlineOutput,
    recovery::{self, diagnostics::*},
};

pub fn parse_for_recovery(raw: &str) -> Result<ParsedOutlineOutput, String> {
    let compiled = compile(raw)?;
    let canonical =
        json!({"operation":"create","expected_revision":null,"outline":compiled.outline})
            .to_string();
    let mut checked = recovery::compile_json(&canonical, |_| Some(0)).map_err(|e| e.to_string())?;
    checked.proof.contract_version = VERSION.into();
    checked.proof.input_sha256 = sha256_hex(raw.as_bytes());
    checked.proof.schema_passed = true;
    checked.proof.business_string_invariant_passed = true;
    checked.proof.edits.push(RepairEdit {
        operation: "compile_outline_markdown".into(),
        source_byte_start: 0,
        source_byte_end: raw.len(),
        token: None,
        target_pointer: "/outline".into(),
        before_hash: sha256_hex(raw.as_bytes()),
        after_hash: sha256_hex(canonical.as_bytes()),
        constraint_id: VERSION.into(),
        ambiguity: Ambiguity::A0,
    });
    let findings = compiled
        .diagnostics
        .iter()
        .map(|d| DiagnosticFinding {
            code: d.code.clone(),
            stage: RecoveryStage::S7,
            invariant: "outline_markdown_defaults".into(),
            mutation: "normalize".into(),
            scope: "outline".into(),
            multiplicity: "single".into(),
            ambiguity: Ambiguity::A0,
            severity: FindingSeverity::Warning,
            json_pointer: d.path.clone(),
            source_byte_start: None,
            source_byte_end: None,
            expected: "component default or a recognized field".into(),
            actual: format!("line {}", d.line),
            evidence_hash: sha256_hex(format!("{}:{}:{}", d.line, d.path, d.code).as_bytes()),
            constraint_id: Some(VERSION.into()),
        })
        .collect();
    Ok(ParsedOutlineOutput {
        operation: decode::OutlineOperation::Create,
        expected_revision: None,
        outline: serde_json::from_value(compiled.outline).map_err(|e| e.to_string())?,
        canonical_json: canonical,
        syntax_repair_count: compiled.diagnostics.len(),
        syntax_repair_summary: format!("{VERSION}:defaults={}", compiled.diagnostics.len()),
        image_type_repair_count: compiled
            .diagnostics
            .iter()
            .filter(|d| d.path.ends_with("/type") && d.code == "invalid_value_defaulted")
            .count(),
        missing_generated_image_type_repair_count: 0,
        blank_paragraph_repair_count: 0,
        ignored_unknown_field_count: compiled
            .diagnostics
            .iter()
            .filter(|d| d.code.contains("unknown"))
            .count(),
        diagnostic_report: DiagnosticReport::from_findings(findings),
        repair_proof: checked.proof,
    })
}

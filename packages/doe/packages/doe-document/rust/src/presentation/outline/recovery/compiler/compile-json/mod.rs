// Origin: app/backend/core/src/outline_recovery/compiler.rs::compile_json
use super::*;


pub fn compile_json(
    raw: &str,
    _rank: impl Fn(&Value) -> Option<usize>,
) -> Result<CompiledJson, String> {
    let framed = frame_single_json_document(raw)?;
    let before_strings = decoded_string_multiset_hash(&framed.source);
    let mut linear = repair_lexical_boundaries(&framed.source)?;
    linear.findings.splice(0..0, framed.findings);
    linear.edits.splice(0..0, framed.edits);
    linear.syntax_report.extend(framed.syntax_report);
    let lexical_after_boundary = repair_lexical_boundaries(&linear.source)?;
    linear.source = lexical_after_boundary.source;
    linear.findings.extend(lexical_after_boundary.findings);
    linear.edits.extend(lexical_after_boundary.edits);
    linear
        .syntax_report
        .extend(lexical_after_boundary.syntax_report);
    if let Err(lexical_error) = parse_unique_json(&linear.source) {
        let structural = repair_structural_boundaries(&linear.source)
            .map_err(|error| format!("{error}; lexical pass: {lexical_error}"))?;
        linear.source = structural.source;
        linear.findings.extend(structural.findings);
        linear.edits.extend(structural.edits);
        linear.syntax_report.extend(structural.syntax_report);
    }
    let strict_value = parse_unique_json(&linear.source)?;
    let after_strings = decoded_string_multiset_hash(&linear.source);
    let business_string_invariant_passed = before_strings == after_strings;
    if !business_string_invariant_passed {
        return Err("deterministic recovery changed decoded JSON strings".to_string());
    }

    let canonical_source =
        serde_json::to_string(&strict_value).map_err(|error| error.to_string())?;
    let canonical_again = serde_json::to_string(&parse_unique_json(&canonical_source)?)
        .map_err(|error| error.to_string())?;
    let canonicalization_idempotent = canonical_source == canonical_again;
    if !canonicalization_idempotent {
        return Err("canonical JSON serialization was not idempotent".to_string());
    }

    let diagnostics = DiagnosticReport::from_findings(linear.findings);
    let proof = RepairProof {
        contract_version: OUTLINE_CONTRACT_VERSION.to_string(),
        input_sha256: sha256_hex(raw.as_bytes()),
        output_sha256: sha256_hex(canonical_source.as_bytes()),
        edits: linear.edits,
        decoded_business_string_multiset_before: before_strings,
        decoded_business_string_multiset_after: after_strings,
        strict_parse_passed: true,
        duplicate_key_check_passed: true,
        schema_passed: false,
        canonicalization_idempotent,
        business_string_invariant_passed,
    };

    Ok(CompiledJson {
        value: strict_value,
        canonical_source,
        syntax_report: linear.syntax_report,
        diagnostics,
        proof,
    })
}

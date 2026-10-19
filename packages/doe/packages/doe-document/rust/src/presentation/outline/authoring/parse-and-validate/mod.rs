// Origin: app/backend/core/src/outline_agent_output_contract.rs::parse_and_validate
use super::*;


pub fn parse_and_validate(raw: &str) -> Result<ParsedOutlineOutput, String> {
    if crate::presentation::outline::markdown::is_markdown(raw) {
        return crate::presentation::outline::markdown::parse_for_recovery(raw);
    }
    if raw.trim().is_empty() {
        return Err(format!("{EMPTY_OUTPUT_ERROR}: response content was empty"));
    }
    if raw.len() > MAX_OUTPUT_BYTES {
        return Err(format!(
            "{OUTPUT_TOO_LARGE_ERROR}: response exceeded {MAX_OUTPUT_BYTES} bytes"
        ));
    }
    let mut compiled = outline_recovery::compile_json(raw, rank_outline_wire_candidate)
        .map_err(|error| format!("{INVALID_JSON_ERROR}: {error}"))?;
    if outline_recovery::circuit_breaker::deterministic_recovery_is_open()
        && !compiled.proof.edits.is_empty()
    {
        return Err(
            "outline_agent_recovery_circuit_open: deterministic repair is temporarily disabled"
                .to_string(),
        );
    }
    // The Recovery Compiler records its deterministic edits in both RepairProof
    // and the syntax report; count the report once while retaining the proof.
    let sequential_repair_count = 0usize;
    let value = compiled.value;
    let mut syntax_repair_report = compiled.syntax_report;
    syntax_repair_report.set_scope("envelope");
    let ignored_envelope_field_count = validate_unknown_fields(
        value
            .as_object()
            .ok_or_else(|| format!("{SCHEMA_MISMATCH_ERROR}: envelope must be an object"))?,
        &["operation", "expected_revision", "outline"],
        "envelope",
    )?;
    let envelope: OutlineEnvelope = serde_json::from_value(value.clone())
        .map_err(|error| format!("{SCHEMA_MISMATCH_ERROR}: {error}"))?;
    match envelope.operation {
        OutlineOperation::Create if envelope.expected_revision.is_some() => {
            return Err(format!(
                "{OUTPUT_CONTRACT_VIOLATION_ERROR}: create requires expected_revision null"
            ));
        }
        OutlineOperation::Replace | OutlineOperation::Edit
            if envelope
                .expected_revision
                .is_none_or(|revision| revision <= 0) =>
        {
            return Err(format!(
                "{OUTPUT_CONTRACT_VIOLATION_ERROR}: replace and edit require a positive expected_revision"
            ));
        }
        _ => {}
    }
    let (
        canonical_outline,
        semantic_source_outline,
        contents_syntax_repairs,
        nested_repair_edits,
        image_type_repair_count,
        missing_generated_image_type_repair_count,
        blank_paragraph_repair_count,
        ignored_outline_field_count,
    ) = canonicalize_outline(envelope.outline)?;
    syntax_repair_report.extend(contents_syntax_repairs);
    if syntax_repair_report
        .count()
        .saturating_add(sequential_repair_count)
        > MAX_JSON_SYNTAX_REPAIRS_PER_OUTLINE
    {
        return Err(format!(
            "{SCHEMA_MISMATCH_ERROR}: JSON syntax repair count exceeded {MAX_JSON_SYNTAX_REPAIRS_PER_OUTLINE}"
        ));
    }
    let outline = serde_json::from_value::<OutlineInput>(canonical_outline.clone())
        .map_err(|error| format!("{SCHEMA_MISMATCH_ERROR}: {error}"))?;
    OutlineContractGraph::current()
        .validate_canonical_outline(outline.clone())
        .map_err(|error| format!("{OUTPUT_CONTRACT_VIOLATION_ERROR}: {error}"))?;
    let canonical_value = json!({
        "operation": envelope.operation,
        "expected_revision": envelope.expected_revision,
        "outline": canonical_outline,
    });
    let canonical_json = serde_json::to_string(&canonical_value)
        .map_err(|error| format!("{INVALID_JSON_ERROR}: {error}"))?;
    let canonical_reparsed = serde_json::from_str::<Value>(&canonical_json)
        .map_err(|error| format!("{INVALID_JSON_ERROR}: {error}"))?;
    if canonical_reparsed != canonical_value {
        outline_recovery::circuit_breaker::record_deterministic_recovery_defect();
        return Err(format!(
            "{OUTPUT_CONTRACT_VIOLATION_ERROR}: canonical serialization was not idempotent"
        ));
    }
    let mut semantic_source_value = value;
    semantic_source_value
        .as_object_mut()
        .expect("validated Outline envelope")
        .insert("outline".to_string(), semantic_source_outline);
    let semantic_before = business_string_multiset_hash(&semantic_source_value);
    let semantic_after = business_string_multiset_hash(&canonical_value);
    if semantic_before != semantic_after {
        outline_recovery::circuit_breaker::record_deterministic_recovery_defect();
        return Err(format!(
            "{OUTPUT_CONTRACT_VIOLATION_ERROR}: deterministic semantic recovery changed business strings"
        ));
    }
    let mut semantic_edits = Vec::new();
    collect_safe_structural_edits(
        &semantic_source_value,
        &canonical_value,
        "",
        &mut semantic_edits,
    )?;
    compiled.proof.edits.extend(nested_repair_edits);
    compiled.proof.edits.extend(semantic_edits);
    compiled.proof.schema_passed = true;
    compiled.proof.output_sha256 =
        crate::presentation::outline::recovery::diagnostics::sha256_hex(canonical_json.as_bytes());
    compiled.proof.decoded_business_string_multiset_before = semantic_before;
    compiled.proof.decoded_business_string_multiset_after = semantic_after;
    compiled.proof.business_string_invariant_passed = true;
    if outline_recovery::circuit_breaker::deterministic_recovery_is_open()
        && !compiled.proof.edits.is_empty()
    {
        return Err(
            "outline_agent_recovery_circuit_open: deterministic repair is temporarily disabled"
                .to_string(),
        );
    }
    let syntax_repair_summary = [
        syntax_repair_report.summary(),
        (!compiled.proof.edits.is_empty())
            .then(|| {
                format!(
                    "envelope:sequential_structural_repair={}",
                    compiled.proof.edits.len()
                )
            })
            .unwrap_or_default(),
    ]
    .into_iter()
    .filter(|part| !part.is_empty())
    .collect::<Vec<_>>()
    .join(",");
    Ok(ParsedOutlineOutput {
        operation: envelope.operation,
        expected_revision: envelope.expected_revision,
        outline,
        canonical_json,
        syntax_repair_count: syntax_repair_report
            .count()
            .saturating_add(sequential_repair_count),
        syntax_repair_summary,
        image_type_repair_count,
        missing_generated_image_type_repair_count,
        blank_paragraph_repair_count,
        ignored_unknown_field_count: ignored_envelope_field_count
            .saturating_add(ignored_outline_field_count),
        diagnostic_report: compiled.diagnostics,
        repair_proof: compiled.proof,
    })
}

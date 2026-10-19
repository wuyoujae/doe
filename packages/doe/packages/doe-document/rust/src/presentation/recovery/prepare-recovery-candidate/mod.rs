// Origin: app/backend/core/src/slide_recovery/mod.rs::prepare_recovery_candidate
use super::*;


pub(super) fn prepare_recovery_candidate(
    raw: &str,
    expectations: SlideDeckExpectations,
    allowed_image_sources: &[String],
    original_error: &str,
) -> Result<(Value, usize, Vec<SlideRepairEdit>), String> {
    let (candidate_raw, framing_edits) = match unique_embedded_deck_object(raw)? {
        Some(candidate_raw) => (
            candidate_raw,
            vec![SlideRepairEdit {
                code: "json.unique_embedded_object".to_string(),
                path: "root".to_string(),
                action: "extract_unique_deck_shaped_json_object".to_string(),
                page_index: None,
                before_sha256: sha256_hex(raw.as_bytes()),
                after_sha256: sha256_hex(candidate_raw.as_bytes()),
                constraint: "exactly one balanced top-level object contains the required Deck envelope markers; all surrounding text is transport framing"
                    .to_string(),
            }],
        ),
        None => (raw, Vec::new()),
    };
    if let Ok(duplicate_aware) = duplicate_json::parse(candidate_raw) {
        if !duplicate_aware.conflicting_paths.is_empty() {
            return Err(format!(
                "slide_agent_ambiguous_duplicate_key: {}",
                duplicate_aware.conflicting_paths.join(",")
            ));
        }
        if !duplicate_aware.equal_paths.is_empty() {
            let paths = duplicate_aware.equal_paths.join(",");
            let repaired_raw = serde_json::to_string(&duplicate_aware.value)
                .map_err(|error| format!("slide_recovery_serialization_failed: {error}"))?;
            let (value, image_source_repair_count) =
                slide_agent_output_contract::prepare_deck_value_for_validation(
                    &repaired_raw,
                    Some(allowed_image_sources),
                )?;
            let mut edits = framing_edits;
            edits.push(SlideRepairEdit {
                code: "json.equal_duplicate_key".to_string(),
                path: "root".to_string(),
                action: format!("remove_equal_duplicate_keys:{paths}"),
                page_index: None,
                before_sha256: sha256_hex(candidate_raw.as_bytes()),
                after_sha256: canonical_value_sha256(&value),
                constraint: "every duplicate value is canonically identical, so removing repeated copies preserves information"
                    .to_string(),
            });
            if duplicate_aware.value != value || image_source_repair_count > 0 {
                edits.push(contract_normalization_edit(
                    &duplicate_aware.value,
                    &value,
                    image_source_repair_count,
                ));
            }
            return Ok((value, image_source_repair_count, edits));
        }
    }
    if let Ok((value, repairs)) = slide_agent_output_contract::prepare_deck_value_for_validation(
        candidate_raw,
        Some(allowed_image_sources),
    ) {
        let mut edits = framing_edits;
        edits.extend(match duplicate_json::parse_strict(candidate_raw) {
            Ok(source) if source != value || repairs > 0 => {
                vec![contract_normalization_edit(&source, &value, repairs)]
            }
            Ok(_) => Vec::new(),
            Err(_) => vec![SlideRepairEdit {
                code: "json.bounded_syntax_normalization".to_string(),
                path: "root".to_string(),
                action: "apply_unique_bounded_json_syntax_repair".to_string(),
                page_index: None,
                before_sha256: sha256_hex(candidate_raw.as_bytes()),
                after_sha256: canonical_value_sha256(&value),
                constraint: "the bounded parser produced one contract-valid Deck candidate"
                    .to_string(),
            }],
        });
        return Ok((value, repairs, edits));
    }
    if !original_error.starts_with(INVALID_JSON_ERROR) {
        return Err(original_error.to_string());
    }

    let repaired = doe_core::json::syntax::parse_json_with_syntax_repair_ranked_source(
        candidate_raw,
        |value| candidate_shape_rank(value, expectations),
    )
    .map_err(|_| original_error.to_string())?;
    if repaired.report.count() == 0 {
        return Err(original_error.to_string());
    }
    let repaired_summary = repaired.report.summary();
    let repaired_raw = serde_json::to_string(&repaired.value)
        .map_err(|error| format!("slide_recovery_serialization_failed: {error}"))?;
    let (value, image_source_repair_count) =
        slide_agent_output_contract::prepare_deck_value_for_validation(
            &repaired_raw,
            Some(allowed_image_sources),
        )?;
    let edit = SlideRepairEdit {
        code: "json.grammar_unique".to_string(),
        path: "root".to_string(),
        action: repaired_summary,
        page_index: None,
        before_sha256: sha256_hex(candidate_raw.as_bytes()),
        after_sha256: canonical_value_sha256(&value),
        constraint: "unique minimum-cost JSON candidate with the expected Deck shape".to_string(),
    };
    let mut edits = framing_edits;
    edits.push(edit);
    Ok((value, image_source_repair_count, edits))
}

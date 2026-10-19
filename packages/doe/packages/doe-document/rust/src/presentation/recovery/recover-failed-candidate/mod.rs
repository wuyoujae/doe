// Origin: app/backend/core/src/slide_recovery/mod.rs::recover_failed_candidate
use super::*;


pub(super) fn recover_failed_candidate(
    raw: &str,
    expectations: SlideDeckExpectations,
    allowed_image_sources: &[String],
    original_sha256: String,
    original_error: String,
) -> Result<RecoveredSlideDeck, String> {
    let (mut candidate, image_source_repair_count, preprocessing_edits) =
        prepare_recovery_candidate(raw, expectations, allowed_image_sources, &original_error)?;
    let mut diagnostics = collect_diagnostics(&candidate, expectations);
    if diagnostics.is_empty() {
        diagnostics.push(diagnostic_from_error(&original_error, None));
    }

    let slides = candidate_slides(&candidate).ok_or_else(|| original_error.clone())?;
    let frozen_indices = slides
        .iter()
        .enumerate()
        .filter_map(|(index, slide)| {
            slide_agent_output_contract::validate_slide_value(slide, index)
                .is_ok()
                .then_some(index)
        })
        .collect::<BTreeSet<_>>();
    let frozen_before = frozen_indices
        .iter()
        .filter_map(|index| {
            slides
                .get(*index)
                .map(|slide| (*index, canonical_value_sha256(slide)))
        })
        .collect::<Vec<_>>();

    let mut edits = preprocessing_edits;
    repair_contract_unique_fields(&mut candidate, expectations, &frozen_indices, &mut edits)?;
    if edits.len() > MAX_DETERMINISTIC_EDITS {
        return Err(format!(
            "slide_recovery_budget_exceeded: deterministic repair exceeded {MAX_DETERMINISTIC_EDITS} edits"
        ));
    }

    slide_agent_output_contract::validate_deck_value(&candidate, expectations)
        .map_err(|error| format!("{error}; recovery_original_error={original_error}"))?;
    verify_frozen_slides(&candidate, &frozen_before)?;

    let mut idempotency_probe = candidate.clone();
    let mut second_pass_edits = Vec::new();
    repair_contract_unique_fields(
        &mut idempotency_probe,
        expectations,
        &BTreeSet::new(),
        &mut second_pass_edits,
    )?;
    if idempotency_probe != candidate || !second_pass_edits.is_empty() {
        return Err(
            "slide_recovery_non_idempotent: deterministic repair changed an accepted candidate"
                .to_string(),
        );
    }

    let frozen_slides = frozen_before
        .into_iter()
        .map(|(page_index, before_sha256)| {
            let slide = &candidate["deck"]["slides"][page_index];
            FrozenSlideProof {
                page_index,
                slide_id: slide_id(slide, page_index),
                after_sha256: canonical_value_sha256(slide),
                before_sha256,
            }
        })
        .collect::<Vec<_>>();
    let parsed = slide_agent_output_contract::parsed_deck_from_valid_value(
        candidate,
        image_source_repair_count,
    )?;
    let candidate_sha256 = sha256_hex(parsed.canonical_json.as_bytes());

    Ok(RecoveredSlideDeck {
        proof: SlideRepairProof {
            disposition: SlideRecoveryDisposition::DeterministicRepair,
            original_sha256,
            candidate_sha256,
            original_error: Some(original_error),
            diagnostics: {
                diagnostics.sort_by(|left, right| {
                    left.page_index
                        .cmp(&right.page_index)
                        .then_with(|| left.path.cmp(&right.path))
                        .then_with(|| left.code.cmp(&right.code))
                });
                diagnostics.dedup();
                diagnostics
            },
            edits,
            frozen_slides,
            image_source_repair_count,
            model_attempts: Vec::new(),
            render_validation: None,
            grounding_validation: None,
        },
        parsed,
    })
}

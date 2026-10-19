// Origin: app/backend/core/src/slide_recovery/mod.rs::apply_page_replacements
use super::*;


pub fn apply_page_replacements(
    plan: &SlidePageRepairPlan,
    replacements: &[SlidePageReplacement],
    expectations: SlideDeckExpectations,
    allowed_image_sources: &[String],
    disposition: SlideRecoveryDisposition,
) -> Result<RecoveredSlideDeck, String> {
    if !matches!(
        disposition,
        SlideRecoveryDisposition::AiPageRepair | SlideRecoveryDisposition::DeterministicFallback
    ) {
        return Err("slide_recovery_invalid_replacement_disposition".to_string());
    }
    if replacements.len() != plan.targets.len() {
        return Err("slide_recovery_patch_scope_violation: replacement count mismatch".to_string());
    }
    let target_indices = plan
        .targets
        .iter()
        .map(|target| target.page_index)
        .collect::<BTreeSet<_>>();
    let replacement_indices = replacements
        .iter()
        .map(|replacement| replacement.page_index)
        .collect::<BTreeSet<_>>();
    if target_indices != replacement_indices || replacement_indices.len() != replacements.len() {
        return Err(
            "slide_recovery_patch_scope_violation: replacement pages differ from targets"
                .to_string(),
        );
    }

    let mut candidate = plan.candidate.clone();
    let slides = candidate
        .get_mut("deck")
        .and_then(|deck| deck.get_mut("slides"))
        .and_then(Value::as_array_mut)
        .ok_or_else(|| {
            "slide_recovery_patch_scope_violation: candidate slides missing".to_string()
        })?;
    let mut edits = plan.deterministic_edits.clone();
    for replacement in replacements {
        let target = plan
            .targets
            .iter()
            .find(|target| target.page_index == replacement.page_index)
            .expect("replacement indices equal target indices");
        if replacement.expected_page_sha256 != target.page_sha256 {
            return Err(format!(
                "slide_recovery_stale_patch: page {} hash mismatch",
                replacement.page_index
            ));
        }
        slide_agent_output_contract::validate_slide_value(
            &replacement.slide,
            replacement.page_index,
        )?;
        let before = slides[replacement.page_index].clone();
        slides[replacement.page_index] = replacement.slide.clone();
        record_edit(
            &mut edits,
            match disposition {
                SlideRecoveryDisposition::AiPageRepair => "page.ai_replacement",
                SlideRecoveryDisposition::DeterministicFallback => "page.deterministic_fallback",
                _ => unreachable!(),
            },
            &format!("root.deck.slides[{}]", replacement.page_index),
            "replace_failed_page",
            Some(replacement.page_index),
            &before,
            &replacement.slide,
            "replacement is base-hash bound, page-scoped, and independently contract-valid",
        );
    }

    verify_frozen_slides(
        &candidate,
        &plan
            .frozen_slides
            .iter()
            .map(|page| (page.page_index, page.before_sha256.clone()))
            .collect::<Vec<_>>(),
    )?;
    let raw = serde_json::to_string(&candidate)
        .map_err(|error| format!("slide_recovery_serialization_failed: {error}"))?;
    let mut recovered = recover_agent_deck(&raw, expectations, allowed_image_sources)?;
    if !matches!(
        recovered.proof.disposition,
        SlideRecoveryDisposition::Original | SlideRecoveryDisposition::DeterministicRepair
    ) {
        return Err("slide_recovery_recursive_repair_disposition".to_string());
    }
    edits.extend(recovered.proof.edits);
    recovered.proof = SlideRepairProof {
        disposition,
        original_sha256: plan.original_sha256.clone(),
        candidate_sha256: recovered.proof.candidate_sha256,
        original_error: Some("slide_agent_page_repair_required".to_string()),
        diagnostics: plan.diagnostics.clone(),
        edits,
        frozen_slides: plan.frozen_slides.clone(),
        image_source_repair_count: plan
            .image_source_repair_count
            .saturating_add(recovered.proof.image_source_repair_count),
        model_attempts: Vec::new(),
        render_validation: None,
        grounding_validation: None,
    };
    Ok(recovered)
}

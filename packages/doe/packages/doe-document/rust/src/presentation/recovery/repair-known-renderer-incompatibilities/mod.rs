// Origin: app/backend/core/src/slide_recovery/mod.rs::repair_known_renderer_incompatibilities
use super::*;


pub fn repair_known_renderer_incompatibilities(
    mut recovered: RecoveredSlideDeck,
) -> Result<RecoveredSlideDeck, String> {
    let mut candidate = duplicate_json::parse_strict(&recovered.parsed.canonical_json)
        .map_err(|_| "slide_recovery_renderer_normalization_invalid_json".to_string())?;
    let mut edits = Vec::new();
    let mut changed_pages = BTreeSet::new();
    let Some(slides) = candidate
        .get_mut("deck")
        .and_then(|deck| deck.get_mut("slides"))
        .and_then(Value::as_array_mut)
    else {
        return Err("slide_recovery_renderer_normalization_slides_missing".to_string());
    };
    for (page_index, slide) in slides.iter_mut().enumerate() {
        let before = canonical_value_sha256(slide);
        repair_known_renderer_slide(slide, page_index, &mut edits);
        if canonical_value_sha256(slide) != before {
            changed_pages.insert(page_index);
        }
    }
    let page_count = slides.len();
    if edits.is_empty() {
        return Ok(recovered);
    }
    if edits.len() > MAX_DETERMINISTIC_EDITS {
        return Err(format!(
            "slide_recovery_budget_exceeded: renderer normalization exceeded {MAX_DETERMINISTIC_EDITS} edits"
        ));
    }
    slide_agent_output_contract::validate_deck_value(
        &candidate,
        SlideDeckExpectations::new(page_count)?,
    )?;
    let mut idempotency_probe = candidate.clone();
    let mut second_pass_edits = Vec::new();
    if let Some(slides) = idempotency_probe
        .get_mut("deck")
        .and_then(|deck| deck.get_mut("slides"))
        .and_then(Value::as_array_mut)
    {
        for (page_index, slide) in slides.iter_mut().enumerate() {
            repair_known_renderer_slide(slide, page_index, &mut second_pass_edits);
        }
    }
    if idempotency_probe != candidate || !second_pass_edits.is_empty() {
        return Err(
            "slide_recovery_non_idempotent: renderer normalization changed an accepted candidate"
                .to_string(),
        );
    }

    recovered.proof.edits.extend(edits);
    recovered
        .proof
        .frozen_slides
        .retain(|proof| !changed_pages.contains(&proof.page_index));
    for page_index in &changed_pages {
        recovered.proof.diagnostics.push(render_diagnostic(
            "renderer.legacy_contract_normalized",
            &format!("root.deck.slides[{page_index}]"),
            "a known renderer-incompatible legacy field was deterministically migrated without discarding business content",
            *page_index,
        ));
    }
    recovered.proof.diagnostics.sort_by(|left, right| {
        left.page_index
            .cmp(&right.page_index)
            .then_with(|| left.path.cmp(&right.path))
            .then_with(|| left.code.cmp(&right.code))
    });
    recovered.proof.diagnostics.dedup();
    recovered.proof.disposition = match recovered.proof.disposition {
        SlideRecoveryDisposition::Original | SlideRecoveryDisposition::DeterministicRepair => {
            SlideRecoveryDisposition::DeterministicRepair
        }
        disposition => disposition,
    };
    recovered
        .proof
        .original_error
        .get_or_insert_with(|| "slide_agent_renderer_contract_normalization_required".to_string());
    recovered.proof.render_validation = None;
    recovered.proof.grounding_validation = None;
    let parsed = slide_agent_output_contract::parsed_deck_from_valid_value(
        candidate,
        recovered.proof.image_source_repair_count,
    )?;
    recovered.proof.candidate_sha256 = sha256_hex(parsed.canonical_json.as_bytes());
    recovered.parsed = parsed;
    Ok(recovered)
}

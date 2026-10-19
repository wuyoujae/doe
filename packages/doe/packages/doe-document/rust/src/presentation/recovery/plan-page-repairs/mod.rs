// Origin: app/backend/core/src/slide_recovery/mod.rs::plan_page_repairs
use super::*;


pub fn plan_page_repairs(
    raw: &str,
    expectations: SlideDeckExpectations,
    allowed_image_sources: &[String],
) -> Result<SlidePageRepairPlan, String> {
    let original_sha256 = sha256_hex(raw.as_bytes());
    let original_error = match slide_agent_output_contract::parse_and_validate_agent_deck(
        raw,
        expectations,
        allowed_image_sources,
    ) {
        Ok(_) => {
            return Err(
                "slide_recovery_page_plan_not_required: candidate is already valid".to_string(),
            )
        }
        Err(error) => error,
    };
    let (mut candidate, image_source_repair_count, preprocessing_edits) =
        prepare_recovery_candidate(raw, expectations, allowed_image_sources, &original_error)?;
    let slides = candidate_slides(&candidate).ok_or_else(|| original_error.clone())?;
    if slides.len() != expectations.slide_count {
        return Err(original_error);
    }

    let mut invalid_indices = slides
        .iter()
        .enumerate()
        .filter_map(|(index, slide)| {
            slide_agent_output_contract::validate_slide_value(slide, index)
                .is_err()
                .then_some(index)
        })
        .collect::<BTreeSet<_>>();
    invalid_indices.extend(duplicate_slide_id_indices(slides));
    let initially_frozen = (0..slides.len())
        .filter(|index| !invalid_indices.contains(index))
        .collect::<BTreeSet<_>>();
    let mut diagnostics = collect_diagnostics(&candidate, expectations);
    let mut deterministic_edits = preprocessing_edits;
    repair_contract_unique_fields(
        &mut candidate,
        expectations,
        &initially_frozen,
        &mut deterministic_edits,
    )?;

    let slides = candidate_slides(&candidate).ok_or_else(|| original_error.clone())?;
    invalid_indices = slides
        .iter()
        .enumerate()
        .filter_map(|(index, slide)| {
            slide_agent_output_contract::validate_slide_value(slide, index)
                .is_err()
                .then_some(index)
        })
        .collect();
    invalid_indices.extend(duplicate_slide_id_indices(slides));
    if invalid_indices.is_empty() {
        return Err(
            "slide_recovery_page_plan_not_required: candidate is recoverable without AI"
                .to_string(),
        );
    }

    verify_deck_envelope_with_placeholders(&candidate, expectations, &invalid_indices)?;
    diagnostics.extend(collect_diagnostics(&candidate, expectations));
    diagnostics.sort_by(|left, right| {
        left.page_index
            .cmp(&right.page_index)
            .then_with(|| left.path.cmp(&right.path))
            .then_with(|| left.code.cmp(&right.code))
    });
    diagnostics.dedup();
    let targets = invalid_indices
        .iter()
        .map(|page_index| {
            let slide = slides[*page_index].clone();
            SlidePageRepairTarget {
                page_index: *page_index,
                slide_id: slide_id(&slide, *page_index),
                page_sha256: canonical_value_sha256(&slide),
                diagnostics: diagnostics
                    .iter()
                    .filter(|finding| finding.page_index == Some(*page_index))
                    .cloned()
                    .collect(),
                slide,
            }
        })
        .collect::<Vec<_>>();
    let frozen_slides = slides
        .iter()
        .enumerate()
        .filter(|(index, _)| !invalid_indices.contains(index))
        .map(|(page_index, slide)| {
            let hash = canonical_value_sha256(slide);
            FrozenSlideProof {
                page_index,
                slide_id: slide_id(slide, page_index),
                before_sha256: hash.clone(),
                after_sha256: hash,
            }
        })
        .collect();

    Ok(SlidePageRepairPlan {
        original_sha256,
        base_deck_sha256: canonical_value_sha256(&candidate),
        candidate,
        targets,
        frozen_slides,
        diagnostics,
        deterministic_edits,
        image_source_repair_count,
    })
}

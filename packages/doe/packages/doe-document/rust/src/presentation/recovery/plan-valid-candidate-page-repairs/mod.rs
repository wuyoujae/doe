// Origin: app/backend/core/src/slide_recovery/mod.rs::plan_valid_candidate_page_repairs
use super::*;


pub(super) fn plan_valid_candidate_page_repairs(
    recovered: &RecoveredSlideDeck,
    failed_indices: &BTreeSet<usize>,
    diagnostics: Vec<SlideDiagnostic>,
) -> Result<SlidePageRepairPlan, String> {
    let candidate = serde_json::from_str::<Value>(&recovered.parsed.canonical_json)
        .map_err(|error| format!("slide_recovery_valid_candidate_invalid: {error}"))?;
    let slides = candidate_slides(&candidate)
        .ok_or_else(|| "slide_recovery_valid_candidate_slides_missing".to_string())?;
    if failed_indices.is_empty() || failed_indices.iter().any(|index| *index >= slides.len()) {
        return Err("slide_recovery_valid_candidate_target_invalid".to_string());
    }
    let targets = slides
        .iter()
        .enumerate()
        .filter(|(page_index, _)| failed_indices.contains(page_index))
        .map(|(page_index, slide)| SlidePageRepairTarget {
            page_index,
            slide_id: slide_id(slide, page_index),
            page_sha256: canonical_value_sha256(slide),
            diagnostics: diagnostics
                .iter()
                .filter(|finding| finding.page_index == Some(page_index))
                .cloned()
                .collect(),
            slide: slide.clone(),
        })
        .collect::<Vec<_>>();
    let frozen_slides = slides
        .iter()
        .enumerate()
        .filter(|(page_index, _)| !failed_indices.contains(page_index))
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
        original_sha256: recovered.proof.original_sha256.clone(),
        base_deck_sha256: canonical_value_sha256(&candidate),
        candidate,
        targets,
        frozen_slides,
        diagnostics,
        deterministic_edits: recovered.proof.edits.clone(),
        image_source_repair_count: recovered.proof.image_source_repair_count,
    })
}

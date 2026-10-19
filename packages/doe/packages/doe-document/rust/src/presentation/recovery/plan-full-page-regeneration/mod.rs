// Origin: app/backend/core/src/slide_recovery/mod.rs::plan_full_page_regeneration
use super::*;


pub fn plan_full_page_regeneration(
    raw: &str,
    expectations: SlideDeckExpectations,
    grounded_deck_title: &str,
) -> Result<SlidePageRepairPlan, String> {
    let title = grounded_deck_title.trim();
    if title.is_empty() || title.chars().count() > 240 {
        return Err("slide_recovery_full_regeneration_title_invalid".to_string());
    }
    let slides = (0..expectations.slide_count)
        .map(|page_index| {
            let slide_id = format!("__yrkie_recovery_staging_{:03}", page_index + 1);
            json!({
                "id": slide_id,
                "size": {"width": 960, "height": 540, "unit": "pt"},
                "blocks": [{
                    "id": format!("__yrkie_recovery_staging_{:03}_heading", page_index + 1),
                    "type": "heading",
                    "props": {"text": format!("Recovery staging page {}", page_index + 1)}
                }]
            })
        })
        .collect::<Vec<_>>();
    let candidate = json!({
        "version": 4,
        "pageNumber": {"enabled": true, "format": "number"},
        "deck": {"title": title, "theme": "yrkie-theme", "slides": slides},
    });
    slide_agent_output_contract::validate_deck_value(&candidate, expectations)?;
    let candidate_slides = candidate["deck"]["slides"]
        .as_array()
        .expect("validated recovery staging slides");
    let diagnostics = candidate_slides
        .iter()
        .enumerate()
        .map(|(page_index, _)| SlideDiagnostic {
            code: "recovery.full_page_regeneration_required".to_string(),
            path: format!("root.deck.slides[{page_index}]"),
            message: "primary output cannot yield a safe page-partitioned candidate".to_string(),
            page_index: Some(page_index),
            repairability: SlideRepairability::RequiresPageRepair,
        })
        .collect::<Vec<_>>();
    let targets = candidate_slides
        .iter()
        .enumerate()
        .map(|(page_index, slide)| SlidePageRepairTarget {
            page_index,
            slide_id: slide_id(slide, page_index),
            page_sha256: canonical_value_sha256(slide),
            diagnostics: vec![diagnostics[page_index].clone()],
            slide: slide.clone(),
        })
        .collect::<Vec<_>>();
    Ok(SlidePageRepairPlan {
        original_sha256: sha256_hex(raw.as_bytes()),
        base_deck_sha256: canonical_value_sha256(&candidate),
        candidate,
        targets,
        frozen_slides: Vec::new(),
        diagnostics,
        deterministic_edits: Vec::new(),
        image_source_repair_count: 0,
    })
}

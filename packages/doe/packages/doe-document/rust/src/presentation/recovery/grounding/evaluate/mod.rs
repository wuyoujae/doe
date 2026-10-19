// Origin: app/backend/core/src/slide_recovery/grounding.rs::evaluate
use super::*;


pub fn evaluate(
    recovered: &RecoveredSlideDeck,
    provider_context: &Value,
) -> Result<SlideGroundingProof, String> {
    let outline = provider_context
        .get("confirmed_outline")
        .and_then(|value| value.get("outline"))
        .ok_or_else(|| "slide_recovery_grounding_outline_missing".to_string())?;
    let outline_pages = outline
        .get("slides")
        .and_then(Value::as_array)
        .ok_or_else(|| "slide_recovery_grounding_outline_pages_missing".to_string())?;
    if outline_pages.len() != recovered.parsed.slides.len() {
        return Err("slide_recovery_grounding_page_count_mismatch".to_string());
    }

    let pages = outline_pages
        .iter()
        .zip(&recovered.parsed.slides)
        .enumerate()
        .map(|(page_index, (outline_page, slide))| {
            let outline_anchors = semantic_anchors(outline_page, AnchorSource::Outline);
            let slide_anchors = semantic_anchors(slide, AnchorSource::Slide);
            let mut authoritative_facts = GuardedFacts::default();
            collect_outline_guarded_facts(outline_page, &mut authoritative_facts);
            if let Some(delegation) = provider_context.get("delegation") {
                collect_delegation_guarded_facts(delegation, &mut authoritative_facts);
            }
            let mut slide_facts = GuardedFacts::default();
            collect_slide_guarded_facts(slide, &mut slide_facts);
            let unsupported_number_count = slide_facts
                .numbers
                .difference(&authoritative_facts.numbers)
                .count();
            let unsupported_number_count = if unsupported_number_count > 0
                && synthetic_data_allowed(provider_context)
                && has_synthetic_label(&slide_facts)
            {
                0
            } else {
                unsupported_number_count
            };
            let unsupported_url_count = slide_facts
                .urls
                .difference(&authoritative_facts.urls)
                .count();
            let unsupported_attribution_count = slide_facts
                .attributions
                .iter()
                .filter(|value| {
                    !authoritative_facts
                        .strings
                        .iter()
                        .any(|source| source.contains(value.as_str()) || value.contains(source))
                })
                .count();
            let shared_anchor_count = outline_anchors
                .iter()
                .filter(|outline_anchor| {
                    slide_anchors.iter().any(|slide_anchor| {
                        outline_anchor.contains(slide_anchor)
                            || slide_anchor.contains(outline_anchor.as_str())
                    })
                })
                .count();
            SlideGroundingPageProof {
                page_index,
                outline_page_sha256: canonical_value_sha256(outline_page),
                slide_sha256: canonical_value_sha256(slide),
                outline_anchor_count: outline_anchors.len(),
                slide_anchor_count: slide_anchors.len(),
                shared_anchor_count,
                unsupported_number_count,
                unsupported_url_count,
                unsupported_attribution_count,
                accepted: !outline_anchors.is_empty()
                    && !slide_anchors.is_empty()
                    && shared_anchor_count > 0
                    && unsupported_number_count == 0
                    && unsupported_url_count == 0
                    && unsupported_attribution_count == 0,
            }
        })
        .collect::<Vec<_>>();
    Ok(SlideGroundingProof {
        confirmed_outline_sha256: canonical_value_sha256(outline),
        success: pages.iter().all(|page| page.accepted),
        pages,
    })
}

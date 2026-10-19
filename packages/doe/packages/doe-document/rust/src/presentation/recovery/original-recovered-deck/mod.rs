// Origin: app/backend/core/src/slide_recovery/mod.rs::original_recovered_deck
use super::*;


pub(super) fn original_recovered_deck(original_sha256: String, parsed: ParsedSlideDeck) -> RecoveredSlideDeck {
    let candidate_sha256 = sha256_hex(parsed.canonical_json.as_bytes());
    RecoveredSlideDeck {
        proof: SlideRepairProof {
            disposition: SlideRecoveryDisposition::Original,
            original_sha256,
            candidate_sha256,
            original_error: None,
            diagnostics: Vec::new(),
            edits: Vec::new(),
            frozen_slides: parsed
                .slides
                .iter()
                .enumerate()
                .map(|(page_index, slide)| FrozenSlideProof {
                    page_index,
                    slide_id: slide_id(slide, page_index),
                    before_sha256: canonical_value_sha256(slide),
                    after_sha256: canonical_value_sha256(slide),
                })
                .collect(),
            image_source_repair_count: parsed.image_source_repair_count,
            model_attempts: Vec::new(),
            render_validation: None,
            grounding_validation: None,
        },
        parsed,
    }
}

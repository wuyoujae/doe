// Origin: app/backend/core/src/slide_recovery/mod.rs::accept_original_agent_deck
use super::*;


pub fn accept_original_agent_deck(
    raw: &str,
    expectations: SlideDeckExpectations,
    allowed_image_sources: &[String],
) -> Result<RecoveredSlideDeck, String> {
    let parsed = slide_agent_output_contract::parse_and_validate_agent_deck(
        raw,
        expectations,
        allowed_image_sources,
    )?;
    if !parsed_matches_strict_input(raw, &parsed) {
        return Err("slide_recovery_disabled_candidate_requires_normalization".to_string());
    }
    Ok(original_recovered_deck(sha256_hex(raw.as_bytes()), parsed))
}

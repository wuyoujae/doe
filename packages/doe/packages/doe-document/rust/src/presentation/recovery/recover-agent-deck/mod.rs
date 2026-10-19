// Origin: app/backend/core/src/slide_recovery/mod.rs::recover_agent_deck
use super::*;


pub fn recover_agent_deck(
    raw: &str,
    expectations: SlideDeckExpectations,
    allowed_image_sources: &[String],
) -> Result<RecoveredSlideDeck, String> {
    let original_sha256 = sha256_hex(raw.as_bytes());
    if let Ok(duplicate_aware) = duplicate_json::parse(raw) {
        if !duplicate_aware.conflicting_paths.is_empty() {
            return Err(format!(
                "slide_agent_ambiguous_duplicate_key: {}",
                duplicate_aware.conflicting_paths.join(",")
            ));
        }
        if !duplicate_aware.equal_paths.is_empty() {
            return recover_failed_candidate(
                raw,
                expectations,
                allowed_image_sources,
                original_sha256,
                format!(
                    "slide_agent_duplicate_key: {}",
                    duplicate_aware.equal_paths.join(",")
                ),
            );
        }
    }
    match slide_agent_output_contract::parse_and_validate_agent_deck(
        raw,
        expectations,
        allowed_image_sources,
    ) {
        Ok(parsed) if parsed_matches_strict_input(raw, &parsed) => {
            Ok(original_recovered_deck(original_sha256, parsed))
        }
        Ok(_) => recover_failed_candidate(
            raw,
            expectations,
            allowed_image_sources,
            original_sha256,
            "slide_agent_normalization_required".to_string(),
        ),
        Err(original_error) => recover_failed_candidate(
            raw,
            expectations,
            allowed_image_sources,
            original_sha256,
            original_error,
        ),
    }
}

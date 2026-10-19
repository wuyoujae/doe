// Origin: app/backend/core/src/slide_recovery/mod.rs::verify_frozen_slides
use super::*;


pub(super) fn verify_frozen_slides(candidate: &Value, frozen: &[(usize, String)]) -> Result<(), String> {
    let slides = candidate_slides(candidate).ok_or_else(|| {
        "slide_recovery_frozen_page_violation: candidate has no slides".to_string()
    })?;
    for (page_index, expected_hash) in frozen {
        let Some(slide) = slides.get(*page_index) else {
            return Err(format!(
                "slide_recovery_frozen_page_violation: page {page_index} disappeared"
            ));
        };
        if canonical_value_sha256(slide) != *expected_hash {
            return Err(format!(
                "slide_recovery_frozen_page_violation: page {page_index} changed"
            ));
        }
    }
    Ok(())
}

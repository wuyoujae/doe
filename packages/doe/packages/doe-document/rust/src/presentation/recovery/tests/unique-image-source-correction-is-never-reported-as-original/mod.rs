// Origin: app/backend/core/src/slide_recovery/tests.rs::unique_image_source_correction_is_never_reported_as_original
use super::*;


#[test]
pub(super) fn unique_image_source_correction_is_never_reported_as_original() {
    let authoritative =
        "yrkie-asset-data://63fcf3f6d99cc5a81dac438914ed82b76202c21a89a6b878ce489a374ae5723b";
    let mut slide = valid_slide("slide-1", "Image");
    slide["blocks"].as_array_mut().unwrap().push(json!({
        "id": "image-1",
        "type": "media",
        "props": {
            "src": "yrkie-asset-media://063fcf3f6d99cc5a81dac438914ed82b76202c21a89a6b878ce489a374ae5723b",
            "alt": "Image"
        }
    }));

    let outcome = recover_agent_deck(
        &deck(vec![slide]).to_string(),
        expectations(1),
        &[authoritative.to_string()],
    )
    .unwrap();
    assert_eq!(
        outcome.proof.disposition,
        SlideRecoveryDisposition::DeterministicRepair
    );
    assert_eq!(outcome.proof.image_source_repair_count, 1);
    assert_eq!(outcome.proof.edits[0].code, "contract.normalization_unique");
    assert_eq!(
        outcome.parsed.slides[0]["blocks"][1]["props"]["src"],
        authoritative
    );
}

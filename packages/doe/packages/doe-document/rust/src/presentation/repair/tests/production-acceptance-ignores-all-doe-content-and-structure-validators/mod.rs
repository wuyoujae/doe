// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::production_acceptance_ignores_all_doe_content_and_structure_validators
use super::*;


#[test]
pub(super) fn production_acceptance_ignores_all_doe_content_and_structure_validators() {
    let value = json!({
        "version": "future",
        "pageNumber": "not-a-page-number-object",
        "deck": {
            "title": null,
            "theme": "invented-theme",
            "slides": [
                {
                    "id": "duplicate",
                    "size": "not-a-canvas",
                    "blocks": [{
                        "id": null,
                        "type": "future-component",
                        "props": {"content": 42, "anything": [true, null]}
                    }]
                },
                {
                    "id": "duplicate",
                    "unknownSlideField": {"kept": true}
                }
            ]
        }
    });

    let processed = process_with_slide_count(&value.to_string(), 2, true).unwrap();
    assert_eq!(processed.parsed.slides.len(), 2);
    assert_eq!(processed.parsed.title, "Untitled presentation");
    assert_eq!(processed.parsed.theme, "yrkie-theme");
    assert_eq!(
        processed.parsed.slides[0]["blocks"][0]["type"],
        "future-component"
    );
    assert_eq!(
        processed.parsed.slides[0]["blocks"][0]["props"]["content"],
        42
    );
    assert_eq!(
        processed.parsed.slides[1]["unknownSlideField"]["kept"],
        true
    );
    assert_ne!(
        processed.parsed.slides[0]["id"],
        processed.parsed.slides[1]["id"]
    );
    assert!(processed
        .proof
        .operations
        .contains(&SlideAutoRepairV2Operation::StorageShapeNormalized));
}

// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::passes_plain_json_without_an_operation
use super::*;


#[test]
pub(super) fn passes_plain_json_without_an_operation() {
    let raw = valid_deck(r#""plain""#);
    let processed = process_one(&raw, true).unwrap();
    assert!(processed.proof.operations.is_empty());
    assert_eq!(processed.proof.input_sha256, processed.proof.output_sha256);
    assert_eq!(processed.parsed.slides.len(), 1);
}

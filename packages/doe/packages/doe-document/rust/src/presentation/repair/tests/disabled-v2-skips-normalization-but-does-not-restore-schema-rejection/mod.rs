// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::disabled_v2_skips_normalization_but_does_not_restore_schema_rejection
use super::*;


#[test]
pub(super) fn disabled_v2_skips_normalization_but_does_not_restore_schema_rejection() {
    let mut value = serde_json::from_str::<Value>(&valid_deck(r#""plain""#)).unwrap();
    value["deck"]["slides"][0]["layout"] =
        json!({"preset": "narrative", "spacing": {"sectionGap": "20pt"}});
    let processed = process_one(&value.to_string(), false).unwrap();
    assert!(processed.proof.operations.is_empty());
    assert_eq!(
        processed.parsed.slides[0]["layout"]["spacing"]["sectionGap"],
        "20pt"
    );
}

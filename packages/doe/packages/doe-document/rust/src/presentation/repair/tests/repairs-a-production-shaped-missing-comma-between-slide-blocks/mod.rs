// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::repairs_a_production_shaped_missing_comma_between_slide_blocks
use super::*;


#[test]
pub(super) fn repairs_a_production_shaped_missing_comma_between_slide_blocks() {
    let raw = r#"{"version":4,"deck":{"title":"培训","theme":"yrkie-theme","slides":[{"id":"slide-1","blocks":[{"id":"title","type":"text","props":{"text":"安全生产"}} {"id":"body","type":"text","props":{"text":"先检查，再操作"}}]}]}}"#;

    let processed = process_one(raw, true).unwrap();

    assert!(processed
        .proof
        .operations
        .contains(&SlideAutoRepairV2Operation::JsonSyntaxRepaired));
    let blocks = processed.parsed.slides[0]["blocks"].as_array().unwrap();
    assert_eq!(blocks.len(), 2);
    assert_eq!(blocks[0]["props"]["text"], "安全生产");
    assert_eq!(blocks[1]["props"]["text"], "先检查，再操作");
}

// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::repairs_a_unique_missing_comma_without_changing_slide_content
use super::*;


#[test]
pub(super) fn repairs_a_unique_missing_comma_without_changing_slide_content() {
    let raw = valid_deck(r#""设备巡检：温度、振动与噪声""#)
        .replace(r#""type":"text","props""#, r#""type":"text" "props""#);

    let processed = process_one(&raw, true).unwrap();

    assert_eq!(
        processed.proof.operations,
        vec![SlideAutoRepairV2Operation::JsonSyntaxRepaired]
    );
    assert_eq!(
        processed.parsed.slides[0]["blocks"][0]["props"]["text"],
        "设备巡检：温度、振动与噪声"
    );
    serde_json::from_str::<Value>(&processed.parsed.canonical_json)
        .expect("repaired Slide output must be strict JSON");
}

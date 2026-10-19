// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::preserves_backticks_inside_a_json_string
use super::*;


#[test]
pub(super) fn preserves_backticks_inside_a_json_string() {
    let raw = valid_deck(r#""literal ``` marker""#);
    let wrapped = format!("```json\n{raw}\n```");
    let processed = process_one(&wrapped, true).unwrap();
    assert_eq!(
        processed.parsed.slides[0]["blocks"][0]["props"]["text"],
        "literal ``` marker"
    );
}

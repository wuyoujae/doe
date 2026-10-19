// Origin: app/backend/core/src/slide_agent_output_contract/validation/tests.rs::runtime_fields_and_legitimate_code_strings_remain_unchanged
use super::*;


#[test]
pub(super) fn runtime_fields_and_legitimate_code_strings_remain_unchanged() {
    let mut slide = page("code-block");
    slide["editor"] = json!(true);
    slide["runtimeState"] = json!({"retained":true});
    slide["blocks"][0]["props"]["code"] = json!(r#"{"props":{"text":"JSON source"}}"#);
    slide["blocks"][0]["props"]["legacySource"] = json!("existing metadata");
    slide["blocks"][0]["layout"] = json!({"span":"auto","region":null,"textFit":{"mode":"readable"},"slotSpace":{"top":"6pt"}});
    let original = slide.clone();
    validate_slide(&slide).unwrap();
    assert_eq!(slide, original);
}

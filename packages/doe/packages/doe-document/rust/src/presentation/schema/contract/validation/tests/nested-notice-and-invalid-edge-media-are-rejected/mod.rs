// Origin: app/backend/core/src/slide_agent_output_contract/validation/tests.rs::nested_notice_and_invalid_edge_media_are_rejected
use super::*;


#[test]
pub(super) fn nested_notice_and_invalid_edge_media_are_rejected() {
    let mut slide = page("notice");
    let notice = slide["blocks"][0].clone();
    slide["blocks"] = json!([{"id":"composition","type":"layout-group","layout":{"variant":"composition"},"children":[
        {"id":"stack","type":"layout-group","layout":{"variant":"stack"},"children":[notice]}
    ]}]);
    let error = validate_slide(&slide).unwrap_err();
    assert!(error.issues[0].message.contains("composition ancestor"));
    slide["blocks"][0]["layout"]["variant"] = json!("row");
    validate_slide(&slide).unwrap();
    slide["layout"] = json!({"preset":"edge-media"});
    assert!(validate_slide(&slide).is_err());
}

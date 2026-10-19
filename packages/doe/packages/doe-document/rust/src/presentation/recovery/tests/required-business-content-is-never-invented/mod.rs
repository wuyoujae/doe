// Origin: app/backend/core/src/slide_recovery/tests.rs::required_business_content_is_never_invented
use super::*;


#[test]
pub(super) fn required_business_content_is_never_invented() {
    let mut slide = valid_slide("slide-1", "Missing business content");
    slide["blocks"][0]["props"] = json!({});
    let raw = deck(vec![slide]).to_string();

    let error = recover_agent_deck(&raw, expectations(1), &[])
        .expect_err("missing business text requires page-scoped AI repair");
    assert!(error.contains("text is required"), "{error}");
}

// Origin: app/backend/core/src/slide_agent_output_contract/validation/tests.rs::stringified_containers_fail_at_the_actual_path
use super::*;


#[test]
pub(super) fn stringified_containers_fail_at_the_actual_path() {
    for pointer in [
        "/blocks/0/props",
        "/blocks/0/props/content",
        "/blocks/0/props/content/items",
    ] {
        let mut slide = page("numbered-icon-cards");
        let target = slide.pointer_mut(pointer).unwrap();
        *target = json!(target.to_string());
        let failure = validate_slide(&slide).unwrap_err();
        assert_eq!(failure.error, "doe_slide_validation_failed");
        assert_eq!(failure.issues[0].path, format!("/slide{pointer}"));
        assert!(!failure.issues[0].message.contains("two to six"));
    }
}

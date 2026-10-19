// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::agent_outline_image_reference_rules_cover_all_current_ratios_and_rejected_forms
use super::*;


#[test]
pub(super) fn agent_outline_image_reference_rules_cover_all_current_ratios_and_rejected_forms() {
    for image_type in ["content", "decorative"] {
        for ratio in doe_core::asset::generated::PRODUCT_IMAGE_RATIOS {
            let mut value = sample();
            value["body"][0]["contents"] = json!([format!(
                "GENRATEIMG[type={image_type},ratio={ratio}](A subject (side view), no text)"
            )]);
            errors(&value).finish().expect("supported role and ratio");
            let plans = crate::presentation::outline::image_placeholder::scan(&value).unwrap();
            assert_eq!(plans.len(), 1);
            assert_eq!(plans[0].image_type.as_str(), image_type);
            assert_eq!(plans[0].ratio, *ratio);
        }
    }
    for marker in [
        "GENRATEIMG[ratio=4:3](A subject)",
        "GENRATEIMG[type=content, ratio=4:3](A subject)",
        "GENRATEIMG[ratio=4:3,type=content](A subject)",
        "GENRATEIMG[type=content|decorative,ratio=4:3](A subject)",
        "GENRATEIMG[type=content,ratio=4:3,quality=high](A subject)",
        "GENRATEIMG[type=content,ratio=4:3](A subject).",
        "GENRATEIMG[type=content,ratio=4:3](   )",
    ] {
        let mut value = sample();
        value["body"][0]["contents"] = json!([marker]);
        assert!(errors(&value).finish().is_err(), "{marker}");
    }
    let mut value = sample();
    value["body"][0]["contents"] = json!([
        "An inline mention GENRATEIMG[type=content,ratio=4:3](A subject)"
    ]);
    assert!(crate::presentation::outline::image_placeholder::scan(&value).unwrap().is_empty());
}

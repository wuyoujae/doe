// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::typed_image_plans_are_checked_without_materialization_or_repairs
use super::*;


#[test]
pub(super) fn typed_image_plans_are_checked_without_materialization_or_repairs() {
    let mut v = sample();
    v["body"][0]["contents"] = json!([
        "Image plan",
        "GENRATEIMG[type=content,ratio=4:3](A simple diagram (no text))"
    ]);
    assert!(errors(&v).finish().is_ok());
    for s in [
        "GENERATEIMG[type=content,ratio=4:3](prompt)",
        "GENRATEIMG(prompt)",
        "GENRATEIMG[type=other,ratio=4:3](prompt)",
        "GENRATEIMG[type=content,ratio=9:999](prompt)",
        "GENRATEIMG[type=content,ratio=1:1]()",
    ] {
        v["body"][0]["contents"] = json!([s]);
        assert!(errors(&v).issues.iter().any(|i| i.code == "image_marker"));
    }
    v["body"][0]["contents"] = json!(vec!["GENRATEIMG[type=content,ratio=1:1](A diagram)"; 17]);
    assert!(errors(&v).issues.iter().any(|i| i.code == "image_limit"));
}

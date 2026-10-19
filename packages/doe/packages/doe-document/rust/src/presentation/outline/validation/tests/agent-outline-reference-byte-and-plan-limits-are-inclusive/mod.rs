// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::agent_outline_reference_byte_and_plan_limits_are_inclusive
use super::*;


#[test]
pub(super) fn agent_outline_reference_byte_and_plan_limits_are_inclusive() {
    let mut value = sample();
    value["title"] = json!("中".repeat(100));
    value["body"][0]["contents"] = json!(["é".repeat(4000)]);
    errors(&value).finish().expect("exact UTF-8 byte limits");
    value["title"] = json!(format!("{}x", "中".repeat(100)));
    assert!(errors(&value).issues.iter().any(|issue| issue.path == "/outline/title"));
    value["title"] = json!("Title");
    value["body"][0]["contents"] = json!([format!("{}x", "é".repeat(4000))]);
    assert!(errors(&value).issues.iter().any(|issue| issue.code == "text_length"));
    let marker = "GENRATEIMG[type=content,ratio=1:1](A subject)";
    value["body"][0]["contents"] = json!(vec![marker; 16]);
    errors(&value).finish().expect("sixteen image plans");
    value["body"][0]["contents"] = json!(vec![marker; 17]);
    assert!(errors(&value).issues.iter().any(|issue| issue.code == "image_limit"));
}

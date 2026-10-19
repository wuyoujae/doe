// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::actionable_errors_cover_shape_sequence_unknown_fields_and_utf8_capacity
use super::*;


#[test]
pub(super) fn actionable_errors_cover_shape_sequence_unknown_fields_and_utf8_capacity() {
    let mut v = sample();
    v["page_count"] = json!(2);
    v["body"][0]["page"] = json!(0);
    v["body"][0]["index"] = json!("1");
    v["userId"] = json!("secret");
    v["title"] = json!("中".repeat(101));
    let e = errors(&v);
    for code in [
        "additional_property",
        "page_count",
        "page_sequence",
        "text_length",
    ] {
        assert!(e.issues.iter().any(|i| i.code == code), "{code}");
    }
    assert!(e.issues.iter().any(|i| i.path == "/outline/body/0/page"));
    assert!(!serde_json::to_string(&e).unwrap().contains("secret"));
    v["body"] = json!([]);
    assert!(errors(&v).finish().is_err());
    v["body"] = json!([{"contents":"oops"}]);
    assert!(errors(&v).issues.iter().any(|i| i.code == "required"));
}

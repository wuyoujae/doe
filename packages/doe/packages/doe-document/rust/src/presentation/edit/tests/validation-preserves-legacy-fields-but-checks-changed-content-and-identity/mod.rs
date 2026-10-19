// Origin: app/backend/core/src/doe_slide_edit/tests.rs::validation_preserves_legacy_fields_but_checks_changed_content_and_identity
use super::*;


#[test]
pub(super) fn validation_preserves_legacy_fields_but_checks_changed_content_and_identity() {
    let mut slide = page();
    slide["runtimeState"] = json!({"retained":true});
    slide["blocks"][0]["children"][0]["props"]["legacySource"] =
        json!("https://example.invalid/legacy");
    let before = Snapshot {
        authoring_markdown: None,
        slide_id: "s1".into(),
        page_number: 1,
        slide_count: 1,
        revision: 1,
        slide,
        shared: json!({"title":"Legacy", "pageNumber":{"enabled":true,"format":"number"}}),
    };
    let mut candidate = before.slide.clone();
    candidate["blocks"][0]["children"][0]["props"]["text"] = json!("Updated safely");
    super::super::validation::validate(&before, &candidate).unwrap();
    candidate["blocks"][0]["children"][0]["props"]["icon"] =
        json!("<svg viewBox=\"0 0 24 24\"><path d=\"M0 0L24 24\"/></svg>");
    super::super::validation::validate(&before, &candidate).unwrap();
    candidate["blocks"][0]["children"][0]["props"]["text"] = json!("<script>alert(1)</script>");
    assert!(super::super::validation::validate(&before, &candidate).is_err());
    candidate = before.slide.clone();
    candidate["blocks"][0]["children"][1]["id"] = json!("n1");
    assert!(super::super::validation::validate(&before, &candidate).is_err());
}

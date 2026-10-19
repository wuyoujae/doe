// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::removes_theme_managed_style_and_spacing_fields_without_changing_content
use super::*;


#[test]
pub(super) fn removes_theme_managed_style_and_spacing_fields_without_changing_content() {
    let mut value = serde_json::from_str::<Value>(&valid_deck(r#""plain""#)).unwrap();
    value["deck"]["slides"][0]["layout"] = json!({
        "preset": "narrative",
        "spacing": {"pagePadding": "48pt", "sectionGap": "20pt"}
    });
    value["deck"]["slides"][0]["blocks"] = json!([{
        "id": "group",
        "type": "layout-group",
        "layout": {
            "variant": "composition",
            "direction": "row",
            "ratio": "primary-first",
            "gap": "18pt"
        },
        "children": [{
            "id": "body",
            "type": "text",
            "layout": {"span": "full", "slotSpace": {"bottom": "12pt"}},
            "props": {"text": "Content survives", "color": "#ffffff", "fontSize": 24}
        }]
    }]);

    let processed = process_one(&value.to_string(), true).unwrap();
    assert_eq!(
        processed.proof.operations,
        vec![SlideAutoRepairV2Operation::ThemeManagedFieldsRemoved]
    );
    let slide = &processed.parsed.slides[0];
    assert_eq!(slide["layout"]["preset"], "narrative");
    assert!(slide["layout"].get("spacing").is_none());
    let group = &slide["blocks"][0];
    assert_eq!(group["layout"]["ratio"], "primary-first");
    assert!(group["layout"].get("gap").is_none());
    let body = &group["children"][0];
    assert_eq!(body["layout"]["span"], "full");
    assert!(body["layout"].get("slotSpace").is_none());
    assert_eq!(body["props"]["text"], "Content survives");
    assert!(body["props"].get("color").is_none());
    assert!(body["props"].get("fontSize").is_none());
    assert_ne!(processed.proof.input_sha256, processed.proof.output_sha256);
}

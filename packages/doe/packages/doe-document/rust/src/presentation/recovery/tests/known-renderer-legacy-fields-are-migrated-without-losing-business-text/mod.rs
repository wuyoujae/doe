// Origin: app/backend/core/src/slide_recovery/tests.rs::known_renderer_legacy_fields_are_migrated_without_losing_business_text
use super::*;


#[test]
pub(super) fn known_renderer_legacy_fields_are_migrated_without_losing_business_text() {
    let mut slide = valid_slide("slide-1", "Legacy renderer page");
    slide["layout"] = json!({
        "preset": "flow",
        "allowsBleed": false,
        "bleedRegion": null,
        "lockSafeArea": false
    });
    slide["blocks"].as_array_mut().unwrap().extend([
        json!({
            "id": "code",
            "type": "code-block",
            "props": {
                "code": "print('hello')",
                "language": "python",
                "caption": "第一个 Python 示例"
            }
        }),
        json!({
            "id": "chart",
            "type": "line-chart",
            "props": {
                "title": "营业收入趋势",
                "subtitle": "单位：万元",
                "content": {
                    "categories": ["2025年"],
                    "series": [{"name": "营业收入（万元）", "data": [4210]}]
                }
            }
        }),
        json!({
            "id": "donut",
            "type": "donut-chart",
            "props": {
                "title": "收入结构",
                "subtitle": "2025年度占比",
                "content": {
                    "center": {"title": "TOTAL", "value": "100%"},
                    "items": [
                        {"label": "核心业务", "value": 70, "color": "#203754"},
                        {"label": "增长业务", "value": 30, "color": "#bd2d24"}
                    ]
                }
            }
        }),
    ]);
    let raw = deck(vec![slide]).to_string();
    let recovered = recover_agent_deck(&raw, expectations(1), &[]).unwrap();
    assert_eq!(
        recovered.proof.disposition,
        SlideRecoveryDisposition::DeterministicRepair
    );
    let theme_migrated = serde_json::from_str::<Value>(&recovered.parsed.canonical_json).unwrap();
    assert!(
        theme_migrated["deck"]["slides"][0]["blocks"][3]["props"]["content"]["items"][0]
            .get("color")
            .is_none()
    );

    let repaired = repair_known_renderer_incompatibilities(recovered).unwrap();
    assert_eq!(
        repaired.proof.disposition,
        SlideRecoveryDisposition::DeterministicRepair
    );
    let value = serde_json::from_str::<Value>(&repaired.parsed.canonical_json).unwrap();
    let slide = &value["deck"]["slides"][0];
    assert!(slide["layout"].get("allowsBleed").is_none());
    assert!(slide["layout"].get("bleedRegion").is_none());
    assert!(slide["layout"].get("lockSafeArea").is_none());
    let blocks = slide["blocks"].as_array().unwrap();
    let code_group = blocks
        .iter()
        .find(|block| block["id"] == "code-caption-group")
        .expect("legacy code block must be wrapped without changing parent capacity");
    let code_children = code_group["children"].as_array().unwrap();
    let caption = code_children
        .iter()
        .find(|block| block["id"] == "code-caption")
        .expect("legacy code caption must become visible text");
    assert_eq!(caption["props"]["text"], "第一个 Python 示例");
    let code = code_children
        .iter()
        .find(|block| block["id"] == "code")
        .unwrap();
    assert!(code["props"].get("caption").is_none());
    assert_eq!(code["props"]["code"], "print('hello')");
    let chart_group = blocks
        .iter()
        .find(|block| block["id"] == "chart-subtitle-group")
        .expect("legacy chart subtitle must be promoted outside the chart");
    let chart_children = chart_group["children"].as_array().unwrap();
    let subtitle = chart_children
        .iter()
        .find(|block| block["id"] == "chart-subtitle")
        .expect("legacy chart subtitle must remain visible");
    assert_eq!(subtitle["props"]["text"], "单位：万元");
    let chart = chart_children
        .iter()
        .find(|block| block["id"] == "chart")
        .unwrap();
    assert!(chart["props"].get("subtitle").is_none());
    assert_eq!(chart["props"]["title"], "营业收入趋势");
    let donut_group = blocks
        .iter()
        .find(|block| block["id"] == "donut-subtitle-group")
        .expect("legacy donut subtitle must be promoted outside the chart");
    let donut_children = donut_group["children"].as_array().unwrap();
    let donut_subtitle = donut_children
        .iter()
        .find(|block| block["id"] == "donut-subtitle")
        .expect("legacy donut subtitle must remain visible");
    assert_eq!(donut_subtitle["props"]["text"], "2025年度占比");
    let donut = donut_children
        .iter()
        .find(|block| block["id"] == "donut")
        .unwrap();
    assert!(donut["props"].get("subtitle").is_none());
    assert_eq!(donut["props"]["title"], "收入结构");
    assert_eq!(donut["props"]["content"]["center"]["title"], "TOTAL");
    assert!(repaired.proof.edits.iter().any(|edit| {
        edit.code == "renderer.legacy_code_caption"
            && edit
                .constraint
                .contains("without modifying executable code")
    }));
    assert!(repaired.proof.edits.iter().any(|edit| {
        edit.code == "renderer.legacy_chart_subtitle"
            && edit
                .constraint
                .contains("without restoring the component-level title")
    }));

    let second = repair_known_renderer_incompatibilities(repaired.clone()).unwrap();
    assert_eq!(second.parsed.canonical_json, repaired.parsed.canonical_json);
    assert_eq!(second.proof.edits, repaired.proof.edits);
}

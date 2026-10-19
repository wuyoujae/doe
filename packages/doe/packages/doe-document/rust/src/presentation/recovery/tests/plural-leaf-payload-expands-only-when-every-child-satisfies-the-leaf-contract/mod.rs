// Origin: app/backend/core/src/slide_recovery/tests.rs::plural_leaf_payload_expands_only_when_every_child_satisfies_the_leaf_contract
use super::*;


#[test]
pub(super) fn plural_leaf_payload_expands_only_when_every_child_satisfies_the_leaf_contract() {
    let mut slide = valid_slide("slide-1", "Metrics");
    slide["blocks"].as_array_mut().unwrap().push(json!({
        "id": "metrics",
        "type": "stat",
        "props": {
            "content": {
                "items": [
                    {"title": "年度指标", "label": "完成率", "value": 95, "unit": "%", "period": "全年"},
                    {"label": "项目数", "value": 12, "unit": "个", "comparison": "全部按期交付"},
                    {"label": "满意度", "value": 92, "unit": "分"}
                ]
            }
        }
    }));

    let recovered =
        recover_agent_deck(&deck(vec![slide]).to_string(), expectations(1), &[]).unwrap();
    let value = serde_json::from_str::<Value>(&recovered.parsed.canonical_json).unwrap();
    let metrics = &value["deck"]["slides"][0]["blocks"][1];
    assert_eq!(metrics["type"], "layout-group");
    assert_eq!(metrics["kind"], "collection");
    assert_eq!(metrics["children"].as_array().unwrap().len(), 3);
    assert_eq!(metrics["children"][0]["type"], "stat");
    assert_eq!(metrics["children"][0]["props"]["value"], "95%");
    assert_eq!(
        metrics["children"][0]["props"]["description"],
        "年度指标 · 全年"
    );
    assert!(metrics["children"][0]["props"].get("title").is_none());
    assert_eq!(metrics["children"][1]["props"]["label"], "项目数");
    assert_eq!(metrics["children"][1]["props"]["value"], "12个");
    assert_eq!(
        metrics["children"][1]["props"]["description"],
        "全部按期交付"
    );
    assert_eq!(metrics["children"][2]["props"]["value"], "92分");
    assert!(recovered
        .proof
        .edits
        .iter()
        .any(|edit| edit.code == "contract.plural_leaf_collection"));

    let second =
        recover_agent_deck(&recovered.parsed.canonical_json, expectations(1), &[]).unwrap();
    assert_eq!(second.proof.disposition, SlideRecoveryDisposition::Original);
    assert_eq!(
        second.parsed.canonical_json,
        recovered.parsed.canonical_json
    );
}

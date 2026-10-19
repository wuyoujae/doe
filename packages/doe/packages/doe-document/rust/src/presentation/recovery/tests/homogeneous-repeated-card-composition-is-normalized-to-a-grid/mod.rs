// Origin: app/backend/core/src/slide_recovery/tests.rs::homogeneous_repeated_card_composition_is_normalized_to_a_grid
use super::*;


#[test]
pub(super) fn homogeneous_repeated_card_composition_is_normalized_to_a_grid() {
    let mut slide = valid_slide("slide-1", "Repeated cards");
    slide["blocks"].as_array_mut().unwrap().push(json!({
        "id": "cards",
        "type": "layout-group",
        "kind": "container",
        "layout": {
            "variant": "composition",
            "direction": "row",
            "ratio": "auto",
            "columns": 3,
            "maxColumns": 4,
            "gap": "18pt"
        },
        "children": (1..=3).map(|index| json!({
            "id": format!("card-{index}"),
            "type": "layout-group",
            "kind": "cluster",
            "layout": {
                "variant": "auto-grid",
                "direction": "stack",
                "cluster": true,
                "columns": "auto",
                "maxColumns": 4,
                "gap": "12pt"
            },
            "children": [
                {
                    "id": format!("card-{index}-title"),
                    "type": "heading",
                    "props": {"text": format!("场景 {index}")}
                },
                {
                    "id": format!("card-{index}-body"),
                    "type": "text",
                    "props": {"text": format!("必须保留的内容 {index}")}
                }
            ]
        })).collect::<Vec<_>>()
    }));
    let recovered =
        recover_agent_deck(&deck(vec![slide]).to_string(), expectations(1), &[]).unwrap();

    let repaired = repair_known_renderer_incompatibilities(recovered).unwrap();
    let value = serde_json::from_str::<Value>(&repaired.parsed.canonical_json).unwrap();
    let cards = &value["deck"]["slides"][0]["blocks"][1];
    assert_eq!(cards["layout"]["variant"], "grid");
    assert_eq!(cards["layout"]["columns"], 3);
    assert_eq!(cards["children"].as_array().unwrap().len(), 3);
    assert_eq!(cards["children"][0]["layout"]["variant"], "stack");
    assert_eq!(cards["children"][0]["layout"]["columns"], 1);
    assert_eq!(
        cards["children"][2]["children"][1]["props"]["text"],
        "必须保留的内容 3"
    );
    assert!(repaired
        .proof
        .edits
        .iter()
        .any(|edit| edit.code == "renderer.repeated_card_composition"));

    let second = repair_known_renderer_incompatibilities(repaired.clone()).unwrap();
    assert_eq!(second.parsed.canonical_json, repaired.parsed.canonical_json);
    assert_eq!(second.proof.edits, repaired.proof.edits);
}

// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::normalizes_direct_collection_content_arrays_without_changing_items
use super::*;


#[test]
pub(super) fn normalizes_direct_collection_content_arrays_without_changing_items() {
    let mut value = serde_json::from_str::<Value>(&valid_deck(r#""plain""#)).unwrap();
    value["deck"]["slides"][0]["blocks"] = json!([
        {
            "id": "numbered",
            "type": "numbered-icon-cards",
            "props": {"content": [
                {"title": "One", "text": "First", "icon": "circle"},
                {"title": "Two", "text": "Second", "icon": "square"}
            ]}
        },
        {
            "id": "capabilities",
            "type": "capability-cards",
            "props": {"content": [
                {"title": "A", "text": "Alpha"},
                {"title": "B", "text": "Beta"}
            ]}
        }
    ]);

    let processed = process_one(&value.to_string(), true).unwrap();
    assert_eq!(
        processed.proof.operations,
        vec![SlideAutoRepairV2Operation::ComponentContentShapeNormalized]
    );
    let blocks = processed.parsed.slides[0]["blocks"].as_array().unwrap();
    assert_eq!(
        blocks[0]["props"]["content"]["items"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    assert_eq!(blocks[0]["props"]["content"]["items"][0]["title"], "One");
    assert_eq!(blocks[1]["props"]["content"]["items"][1]["text"], "Beta");
}

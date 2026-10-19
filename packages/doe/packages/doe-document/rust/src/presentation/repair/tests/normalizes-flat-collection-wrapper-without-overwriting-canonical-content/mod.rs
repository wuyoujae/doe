// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::normalizes_flat_collection_wrapper_without_overwriting_canonical_content
use super::*;


#[test]
pub(super) fn normalizes_flat_collection_wrapper_without_overwriting_canonical_content() {
    let items = json!([
        {"title": "Diagnose", "icon": "Search", "text": "Keep every original value"},
        {"title": "Evaluate", "icon": "Check", "text": "Measure workplace results"}
    ]);
    let mut value = serde_json::from_str::<Value>(&valid_deck(r#""plain""#)).unwrap();
    value["deck"]["slides"][0]["blocks"] = json!([
        {"id": "flow", "type": "numbered-icon-cards", "props": {"items": items}},
        {"id": "canonical", "type": "numbered-icon-cards", "props": {"items": [], "content": {"items": items}}}
    ]);
    let processed = process_one(&value.to_string(), true).unwrap();
    let blocks = &processed.parsed.slides[0]["blocks"];
    assert_eq!(blocks[0]["props"]["content"]["items"], items);
    assert!(blocks[0]["props"].get("items").is_none());
    assert_eq!(blocks[1]["props"]["content"]["items"], items);
    assert_eq!(crate::presentation::schema::contract::normalize_agent_component_content_shapes(&mut value), 1);
    assert_eq!(crate::presentation::schema::contract::normalize_agent_component_content_shapes(&mut value), 0);
}

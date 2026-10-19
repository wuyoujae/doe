// Origin: app/backend/core/src/slide_recovery/tests.rs::over_capacity_textual_card_collection_falls_back_without_dropping_items
use super::*;


#[test]
pub(super) fn over_capacity_textual_card_collection_falls_back_without_dropping_items() {
    let mut slide = valid_slide("slide-1", "Agenda");
    slide["blocks"].as_array_mut().unwrap().push(json!({
        "id": "agenda",
        "type": "numbered-icon-cards",
        "props": {
            "content": {
                "items": (1..=7).map(|index| json!({
                    "number": format!("{index:02}"),
                    "title": format!("章节 {index}"),
                    "detail": format!("必须保留的说明 {index}")
                })).collect::<Vec<_>>()
            }
        }
    }));

    let recovered =
        recover_agent_deck(&deck(vec![slide]).to_string(), expectations(1), &[]).unwrap();
    assert_eq!(
        recovered.proof.disposition,
        SlideRecoveryDisposition::DeterministicRepair
    );
    let value = serde_json::from_str::<Value>(&recovered.parsed.canonical_json).unwrap();
    let agenda = &value["deck"]["slides"][0]["blocks"][1];
    assert_eq!(agenda["type"], "list");
    let items = agenda["props"]["items"].as_array().unwrap();
    assert_eq!(items.len(), 7);
    for index in 1..=7 {
        let item = items[index - 1].as_str().unwrap();
        assert!(item.contains(&format!("{index:02}")));
        assert!(item.contains(&format!("章节 {index}")));
        assert!(item.contains(&format!("必须保留的说明 {index}")));
    }
    assert!(recovered.proof.edits.iter().any(|edit| {
        edit.code == "contract.text_collection_capacity_fallback"
            && edit.action == "project_over_capacity_text_collection_to_list"
    }));

    let second =
        recover_agent_deck(&recovered.parsed.canonical_json, expectations(1), &[]).unwrap();
    assert_eq!(second.proof.disposition, SlideRecoveryDisposition::Original);
    assert_eq!(
        second.parsed.canonical_json,
        recovered.parsed.canonical_json
    );
}

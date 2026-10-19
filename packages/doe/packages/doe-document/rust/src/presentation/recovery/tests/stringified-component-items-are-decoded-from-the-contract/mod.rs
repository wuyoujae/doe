// Origin: app/backend/core/src/slide_recovery/tests.rs::stringified_component_items_are_decoded_from_the_contract
use super::*;


#[test]
pub(super) fn stringified_component_items_are_decoded_from_the_contract() {
    let mut slide = valid_slide("slide-1", "Cards");
    slide["blocks"][0] = json!({
        "id": "cards",
        "type": "capability-cards",
        "props": {
            "content": {
                "items": [r#"{"title":"One","text":"Detail"}"#]
            }
        }
    });

    let outcome = recover_agent_deck(&deck(vec![slide]).to_string(), expectations(1), &[]).unwrap();
    let repaired: Value = serde_json::from_str(&outcome.parsed.canonical_json).unwrap();
    assert_eq!(
        repaired["deck"]["slides"][0]["blocks"][0]["props"]["content"]["items"][0]["title"],
        "One"
    );
}

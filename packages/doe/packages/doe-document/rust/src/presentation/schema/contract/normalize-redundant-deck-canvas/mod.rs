// Origin: app/backend/core/src/slide_agent_output_contract.rs::normalize_redundant_deck_canvas
use super::*;


pub(super) fn normalize_redundant_deck_canvas(value: &mut Value) {
    let Some(deck) = value.get_mut("deck").and_then(Value::as_object_mut) else {
        return;
    };
    let canonical_canvas = deck.get("size").is_some_and(|size| {
        size.get("width").and_then(Value::as_i64) == Some(960)
            && size.get("height").and_then(Value::as_i64) == Some(540)
            && size.get("unit").and_then(Value::as_str) == Some("pt")
            && size.as_object().is_some_and(|size| size.len() == 3)
    });
    if canonical_canvas {
        deck.remove("size");
    }
}

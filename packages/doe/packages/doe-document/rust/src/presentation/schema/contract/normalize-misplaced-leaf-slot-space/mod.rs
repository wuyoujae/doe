// Origin: app/backend/core/src/slide_agent_output_contract.rs::normalize_misplaced_leaf_slot_space
use super::*;


pub(super) fn normalize_misplaced_leaf_slot_space(value: &mut Value) {
    let Some(slides) = value
        .get_mut("deck")
        .and_then(|deck| deck.get_mut("slides"))
        .and_then(Value::as_array_mut)
    else {
        return;
    };

    for slide in slides {
        let Some(blocks) = slide.get_mut("blocks").and_then(Value::as_array_mut) else {
            continue;
        };
        for block in blocks {
            normalize_node_slot_space(block);
        }
    }
}

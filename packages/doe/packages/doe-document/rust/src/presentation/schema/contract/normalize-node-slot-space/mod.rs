// Origin: app/backend/core/src/slide_agent_output_contract.rs::normalize_node_slot_space
use super::*;


pub(super) fn normalize_node_slot_space(value: &mut Value) {
    let Some(node) = value.as_object_mut() else {
        return;
    };

    if node.get("type").and_then(Value::as_str) != Some("layout-group")
        && node.contains_key("slotSpace")
    {
        let can_move = match node.get("layout") {
            None | Some(Value::Null) => true,
            Some(Value::Object(layout)) => !layout.contains_key("slotSpace"),
            Some(_) => false,
        };
        if can_move {
            let slot_space = node
                .remove("slotSpace")
                .expect("slotSpace exists before normalization");
            let layout = node
                .entry("layout".to_string())
                .or_insert_with(|| Value::Object(Map::new()));
            if layout.is_null() {
                *layout = Value::Object(Map::new());
            }
            layout
                .as_object_mut()
                .expect("normalizable layout is an object")
                .insert("slotSpace".to_string(), slot_space);
        }
    }

    if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
        for child in children {
            normalize_node_slot_space(child);
        }
    }
}

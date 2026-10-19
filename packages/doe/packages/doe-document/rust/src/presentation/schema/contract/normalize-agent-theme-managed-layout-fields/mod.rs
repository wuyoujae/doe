// Origin: app/backend/core/src/slide_agent_output_contract.rs::normalize_agent_theme_managed_layout_fields
use super::*;

// New Agent output never authors spacing values. Presets, Group variants, and
// the Deck theme own those defaults. Keep the renderer fields available for
// historical/editor compatibility, but remove them at the Agent boundary so a
// cosmetic override cannot invalidate or restyle an otherwise valid Deck.
pub fn normalize_agent_theme_managed_layout_fields(value: &mut Value) -> usize {
    let Some(slides) = value
        .get_mut("deck")
        .and_then(Value::as_object_mut)
        .and_then(|deck| deck.get_mut("slides"))
        .and_then(Value::as_array_mut)
    else {
        return 0;
    };

    fn normalize_node(node: &mut Value) -> usize {
        let Some(node) = node.as_object_mut() else {
            return 0;
        };
        let mut removed = 0;
        let is_group = node.get("type").and_then(Value::as_str) == Some("layout-group");
        if let Some(layout) = node.get_mut("layout").and_then(Value::as_object_mut) {
            removed += usize::from(layout.remove("gap").is_some());
            removed += usize::from(layout.remove("slotSpace").is_some());
        }
        if !is_group
            && node
                .get("layout")
                .and_then(Value::as_object)
                .is_some_and(Map::is_empty)
        {
            node.remove("layout");
        }
        if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
            removed += children.iter_mut().map(normalize_node).sum::<usize>();
        }
        removed
    }

    let mut removed = 0;
    for slide in slides {
        if let Some(layout) = slide.get_mut("layout").and_then(Value::as_object_mut) {
            removed += usize::from(layout.remove("spacing").is_some());
        }
        if let Some(blocks) = slide.get_mut("blocks").and_then(Value::as_array_mut) {
            removed += blocks.iter_mut().map(normalize_node).sum::<usize>();
        }
    }
    removed
}

// Origin: app/backend/core/src/slide_agent_output_contract.rs::normalize_theme_managed_component_styles
use super::*;


pub fn normalize_theme_managed_component_styles(value: &mut Value) {
    let Some(slides) = value
        .get_mut("deck")
        .and_then(Value::as_object_mut)
        .and_then(|deck| deck.get_mut("slides"))
        .and_then(Value::as_array_mut)
    else {
        return;
    };

    fn normalize_node(node: &mut Value) {
        let Some(node) = node.as_object_mut() else {
            return;
        };
        if let Some(props) = node.get_mut("props") {
            normalize_props(props);
        }
        if let Some(layout) = node.get_mut("layout") {
            normalize_props(layout);
        }
        if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
            children.iter_mut().for_each(normalize_node);
        }
    }

    fn normalize_props(value: &mut Value) {
        match value {
            Value::Array(items) => items.iter_mut().for_each(normalize_props),
            Value::Object(object) => {
                object.retain(|key, _| !is_theme_managed_component_style_key(key));
                object.values_mut().for_each(normalize_props);
            }
            _ => {}
        }
    }

    for slide in slides {
        if let Some(layout) = slide.get_mut("layout") {
            normalize_props(layout);
        }
        if let Some(blocks) = slide.get_mut("blocks").and_then(Value::as_array_mut) {
            blocks.iter_mut().for_each(normalize_node);
        }
    }
}

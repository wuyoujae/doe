// Origin: app/backend/core/src/slide_agent_output_contract.rs::normalize_agent_component_content_shapes
use super::*;

// Collection renderers require a named array inside `props.content`. Models
// occasionally omit only that wrapper while preserving every item. Repair the
// unambiguous shape here; this is a lossless transport normalization, not a
// semantic validator or content rewrite.
pub fn normalize_agent_component_content_shapes(value: &mut Value) -> usize {
    let Some(slides) = value
        .get_mut("deck")
        .and_then(Value::as_object_mut)
        .and_then(|deck| deck.get_mut("slides"))
        .and_then(Value::as_array_mut)
    else {
        return 0;
    };

    fn collection_key(component_type: &str) -> Option<&'static str> {
        match component_type {
            "capability-cards" | "numbered-icon-cards" | "donut-chart" | "risk-matrix" | "waterfall-chart" => Some("items"),


            _ => None,
        }
    }

    fn normalize_node(node: &mut Value) -> usize {
        let Some(node) = node.as_object_mut() else {
            return 0;
        };
        let component_type = node.get("type").and_then(Value::as_str).map(str::to_owned);
        let mut normalized = 0;
        if let Some(key) = component_type.as_deref().and_then(collection_key) {
            if let Some(props) = node.get_mut("props").and_then(Value::as_object_mut) {
                if props.get("content").is_some_and(Value::is_array) {
                    let content = props
                        .remove("content")
                        .expect("content exists before collection normalization");
                    let mut wrapped = Map::new();
                    wrapped.insert(key.to_string(), content);
                    props.insert("content".to_string(), Value::Object(wrapped));
                    normalized += 1;
                } else if props.get(key).is_some_and(Value::is_array)
                    && props.get("content").is_none_or(|content| {
                        content.is_null()
                            || content.as_object().is_some_and(|content| {
                                content.get(key).is_none_or(Value::is_null)
                            })
                    })
                {
                    let items = props.remove(key).expect("collection was checked above");
                    let content = props.entry("content").or_insert_with(|| json!({}));
                    if content.is_null() {
                        *content = json!({});
                    }
                    content.as_object_mut().expect("content shape was checked above")
                        .insert(key.to_string(), items);
                    normalized += 1;
                }
            }
        }
        if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
            normalized += children.iter_mut().map(normalize_node).sum::<usize>();
        }
        normalized
    }

    slides
        .iter_mut()
        .filter_map(|slide| slide.get_mut("blocks").and_then(Value::as_array_mut))
        .flat_map(|blocks| blocks.iter_mut())
        .map(normalize_node)
        .sum()
}

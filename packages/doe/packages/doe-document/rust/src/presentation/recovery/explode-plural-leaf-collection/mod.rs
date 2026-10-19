// Origin: app/backend/core/src/slide_recovery/mod.rs::explode_plural_leaf_collection
use super::*;


pub(super) fn explode_plural_leaf_collection(
    node: &mut Map<String, Value>,
    node_type: &str,
    path: &str,
    page_index: usize,
    ids: &mut BTreeSet<String>,
    edits: &mut Vec<SlideRepairEdit>,
) {
    if !is_supported_leaf_component(node_type) {
        return;
    }
    let Some(props) = node.get("props").and_then(Value::as_object) else {
        return;
    };
    let Some(content) = props.get("content") else {
        return;
    };
    let items = match content {
        Value::Array(items) => items,
        Value::Object(content) if content.len() == 1 => {
            let Some(items) = content.get("items").and_then(Value::as_array) else {
                return;
            };
            items
        }
        _ => return,
    };
    if !(2..=slide_agent_output_contract::MAX_GROUP_CHILDREN).contains(&items.len())
        || items.iter().any(|item| !item.is_object())
    {
        return;
    }
    let shared_props = props
        .iter()
        .filter(|(key, _)| key.as_str() != "content")
        .map(|(key, value)| (key.clone(), value.clone()))
        .collect::<Map<_, _>>();
    let child_props = items
        .iter()
        .map(|item| {
            let mut props = item.as_object().expect("checked object items").clone();
            for (key, value) in &shared_props {
                props.entry(key.clone()).or_insert_with(|| value.clone());
            }
            props
        })
        .collect::<Vec<_>>();
    if child_props
        .iter()
        .any(|props| !leaf_props_satisfy_contract(node_type, props))
    {
        return;
    }

    let before = Value::Object(node.clone());
    let node_id = node
        .get("id")
        .and_then(Value::as_str)
        .unwrap_or("collection")
        .to_string();
    let children = child_props
        .into_iter()
        .enumerate()
        .map(|(index, props)| {
            json!({
                "id": unique_derived_id(&node_id, &format!("item-{}", index + 1), ids),
                "type": node_type,
                "props": props
            })
        })
        .collect::<Vec<_>>();
    let source_layout = node
        .get("layout")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    let mut layout = source_layout
        .into_iter()
        .filter(|(key, _)| matches!(key.as_str(), "region" | "lock" | "textFit"))
        .collect::<Map<_, _>>();
    layout.insert(
        "variant".to_string(),
        Value::String("auto-grid".to_string()),
    );
    layout.insert("direction".to_string(), Value::String("row".to_string()));
    layout.insert("columns".to_string(), Value::String("auto".to_string()));
    layout.insert("maxColumns".to_string(), json!(children.len().min(4)));
    layout.insert("maxItems".to_string(), json!(children.len()));
    layout.insert(
        "collectionKey".to_string(),
        Value::String(node_type.to_string()),
    );
    layout.insert("keepGroup".to_string(), Value::Bool(true));
    node.insert(
        "type".to_string(),
        Value::String("layout-group".to_string()),
    );
    node.insert("kind".to_string(), Value::String("collection".to_string()));
    node.insert("layout".to_string(), Value::Object(layout));
    node.insert("children".to_string(), Value::Array(children));
    node.remove("props");
    let after = Value::Object(node.clone());
    record_edit(
        edits,
        "contract.plural_leaf_collection",
        &format!("{path}.props.content"),
        "expand_plural_leaf_payload_into_collection_children",
        Some(page_index),
        &before,
        &after,
        "each payload item independently satisfies the same leaf contract, so collection expansion preserves every item and its order",
    );
}

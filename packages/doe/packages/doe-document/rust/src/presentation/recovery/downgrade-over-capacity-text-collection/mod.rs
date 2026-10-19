// Origin: app/backend/core/src/slide_recovery/mod.rs::downgrade_over_capacity_text_collection
use super::*;


pub(super) fn downgrade_over_capacity_text_collection(
    node: &mut Map<String, Value>,
    node_type: &str,
    path: &str,
    page_index: usize,
    edits: &mut Vec<SlideRepairEdit>,
) {
    let Some((collection_key, maximum)) = textual_collection_contract(node_type) else {
        return;
    };
    let Some(props) = node.get("props").and_then(Value::as_object) else {
        return;
    };
    let Some(content) = props.get("content").and_then(Value::as_object) else {
        return;
    };
    let Some(items) = content.get(collection_key).and_then(Value::as_array) else {
        return;
    };
    if items.len() <= maximum || items.len() > 100 {
        return;
    }
    let projected = items
        .iter()
        .map(project_textual_collection_item)
        .collect::<Option<Vec<_>>>();
    let Some(mut projected) = projected else {
        return;
    };
    let title = props
        .get("title")
        .or_else(|| content.get("title"))
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    let mut extras = Vec::new();
    for (key, value) in props {
        if !matches!(key.as_str(), "content" | "title") {
            collect_projectable_business_values(value, Some(key), &mut extras);
        }
    }
    for (key, value) in content {
        if key != collection_key && key != "title" {
            collect_projectable_business_values(value, Some(key), &mut extras);
        }
    }
    deduplicate_projection_values(&mut extras);
    if !extras.is_empty() {
        projected.push(extras.join(" · "));
    }
    if projected.len() > 100 {
        return;
    }

    let before = Value::Object(node.clone());
    node.insert("type".to_string(), Value::String("list".to_string()));
    let mut list_props = Map::new();
    if let Some(title) = title {
        list_props.insert("title".to_string(), Value::String(title));
    }
    list_props.insert(
        "items".to_string(),
        Value::Array(projected.into_iter().map(Value::String).collect()),
    );
    list_props.insert("itemLayout".to_string(), Value::String("auto".to_string()));
    list_props.insert("itemColumns".to_string(), json!(2));
    node.insert("props".to_string(), Value::Object(list_props));
    let after = Value::Object(node.clone());
    record_edit(
        edits,
        "contract.text_collection_capacity_fallback",
        &format!("{path}.props.content.{collection_key}"),
        "project_over_capacity_text_collection_to_list",
        Some(page_index),
        &before,
        &after,
        "every ordered business value is preserved in a list component whose contract supports the complete item count",
    );
}

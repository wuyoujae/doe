// Origin: app/backend/core/src/slide_recovery/mod.rs::repair_node_semantics
use super::*;


pub(super) fn repair_node_semantics(
    node: &mut Value,
    path: &str,
    page_index: usize,
    ids: &mut BTreeSet<String>,
    edits: &mut Vec<SlideRepairEdit>,
) {
    let Some(object) = node.as_object_mut() else {
        return;
    };
    let node_type = object
        .get("type")
        .and_then(Value::as_str)
        .map(str::to_string);
    if node_type.as_deref() == Some("layout-group") {
        if !object.contains_key("layout") {
            let after = json!({});
            object.insert("layout".to_string(), after.clone());
            record_edit(
                edits,
                "contract.required_control_default",
                &format!("{path}.layout"),
                "insert_empty_layout",
                Some(page_index),
                &Value::Null,
                &after,
                "layout-group requires a layout object; the empty object delegates to renderer defaults",
            );
        }
        if object
            .get("props")
            .is_some_and(|props| props.as_object().is_some_and(Map::is_empty) || props.is_null())
        {
            let before = object.remove("props").expect("checked props");
            record_edit(
                edits,
                "contract.forbidden_empty_field",
                &format!("{path}.props"),
                "remove_empty_leaf_props_from_group",
                Some(page_index),
                &before,
                &Value::Null,
                "layout-group forbids props and the removed value contains no business data",
            );
        }
    } else if node_type
        .as_deref()
        .is_some_and(is_supported_leaf_component)
    {
        let empty_children = object
            .get("children")
            .is_some_and(|children| children.as_array().is_some_and(Vec::is_empty));
        if empty_children {
            let before = object.remove("children").expect("checked children");
            record_edit(
                edits,
                "contract.forbidden_empty_field",
                &format!("{path}.children"),
                "remove_empty_group_children_from_leaf",
                Some(page_index),
                &before,
                &Value::Null,
                "leaf components cannot own children and the empty array contains no business data",
            );
        }
        if object.contains_key("kind") && !object.contains_key("children") {
            let before = object.remove("kind").expect("checked kind");
            record_edit(
                edits,
                "contract.forbidden_control_field",
                &format!("{path}.kind"),
                "remove_group_kind_from_leaf",
                Some(page_index),
                &before,
                &Value::Null,
                "kind is a group-only control field and the node discriminator uniquely selects a leaf",
            );
        }
    }

    if let Some(node_type) = node_type.as_deref() {
        explode_plural_leaf_collection(object, node_type, path, page_index, ids, edits);
        normalize_legacy_stat_renderer_props(object, node_type, path, page_index, edits);
        downgrade_over_capacity_text_collection(object, node_type, path, page_index, edits);
    }

    if let Some(children) = object.get_mut("children").and_then(Value::as_array_mut) {
        for (index, child) in children.iter_mut().enumerate() {
            repair_node_semantics(
                child,
                &format!("{path}.children[{index}]"),
                page_index,
                ids,
                edits,
            );
        }
    }
}

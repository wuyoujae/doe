// Origin: app/backend/core/src/slide_recovery/mod.rs::repair_known_renderer_nodes
use super::*;


pub(super) fn repair_known_renderer_nodes(
    nodes: &mut Vec<Value>,
    path: &str,
    page_index: usize,
    ids: &mut BTreeSet<String>,
    edits: &mut Vec<SlideRepairEdit>,
) {
    let mut index = 0;
    while index < nodes.len() {
        let node_path = format!("{path}[{index}]");
        if nodes[index].get("type").and_then(Value::as_str) == Some("layout-group") {
            if let Some(children) = nodes[index]
                .get_mut("children")
                .and_then(Value::as_array_mut)
            {
                repair_known_renderer_nodes(
                    children,
                    &format!("{node_path}.children"),
                    page_index,
                    ids,
                    edits,
                );
            }
            if contradictory_cluster_grid_stack(&nodes[index]) {
                let before = nodes[index].clone();
                if let Some(layout) = nodes[index]
                    .get_mut("layout")
                    .and_then(Value::as_object_mut)
                {
                    layout.insert("variant".to_string(), Value::String("stack".to_string()));
                    layout.insert("direction".to_string(), Value::String("stack".to_string()));
                    layout.insert("columns".to_string(), json!(1));
                    layout.insert("maxColumns".to_string(), json!(1));
                }
                record_edit(
                    edits,
                    "renderer.contradictory_cluster_layout",
                    &format!("{node_path}.layout"),
                    "normalize_vertical_cluster_to_single_column_stack",
                    Some(page_index),
                    &before,
                    &nodes[index],
                    "a local cluster cannot simultaneously request an automatic grid and a vertical stack",
                );
            }
            if let Some(columns) = repeated_cluster_composition_columns(&nodes[index]) {
                let before = nodes[index].clone();
                if let Some(node) = nodes[index].as_object_mut() {
                    if let Some(layout) = node.get_mut("layout").and_then(Value::as_object_mut) {
                        layout.insert("variant".to_string(), Value::String("grid".to_string()));
                        layout.insert("direction".to_string(), Value::String("row".to_string()));
                        layout.insert("columns".to_string(), json!(columns));
                    }
                }
                record_edit(
                    edits,
                    "renderer.repeated_card_composition",
                    &format!("{node_path}.layout.variant"),
                    "normalize_homogeneous_card_row_to_grid",
                    Some(page_index),
                    &before,
                    &nodes[index],
                    "a homogeneous row of repeated card clusters is a grid, not a heterogeneous compression composition",
                );
            }
            index += 1;
            continue;
        }

        let node_type = nodes[index]
            .get("type")
            .and_then(Value::as_str)
            .map(str::to_string);
        if matches!(node_type.as_deref(), Some("line-chart" | "donut-chart")) {
            let before = nodes[index].clone();
            let subtitle = nodes[index]
                .get("props")
                .and_then(Value::as_object)
                .and_then(|props| props.get("subtitle"))
                .and_then(Value::as_str)
                .map(str::trim)
                .map(str::to_string);
            if let Some(subtitle) = subtitle {
                if let Some(props) = nodes[index].get_mut("props").and_then(Value::as_object_mut) {
                    props.remove("subtitle");
                }
                if subtitle.is_empty() {
                    record_edit(
                        edits,
                        "renderer.empty_legacy_chart_subtitle",
                        &format!("{node_path}.props.subtitle"),
                        "remove_empty_unsupported_subtitle",
                        Some(page_index),
                        &before,
                        &nodes[index],
                        "the removed unsupported subtitle is empty and carries no business content",
                    );
                    index += 1;
                    continue;
                }
                let node_id = nodes[index]
                    .get("id")
                    .and_then(Value::as_str)
                    .unwrap_or("chart");
                let subtitle_id = unique_derived_id(node_id, "subtitle", ids);
                let group_id = unique_derived_id(node_id, "subtitle-group", ids);
                let subtitle_node = json!({
                    "id": subtitle_id,
                    "type": "text",
                    "props": {"text": subtitle}
                });
                let chart = nodes[index].clone();
                let group = json!({
                    "id": group_id,
                    "type": "layout-group",
                    "kind": "cluster",
                    "layout": {
                        "variant": "stack",
                        "gap": "6pt",
                        "align": "stretch",
                        "cluster": true
                    },
                    "children": [subtitle_node, chart]
                });
                nodes[index] = group.clone();
                record_edit(
                    edits,
                    "renderer.legacy_chart_subtitle",
                    &format!("{node_path}.props.subtitle"),
                    "promote_subtitle_to_visible_text_sibling",
                    Some(page_index),
                    &before,
                    &group,
                    "the renderer ignores this chart subtitle; a visible adjacent text node preserves it without restoring the component-level title",
                );
                index += 1;
                continue;
            }
        }

        if node_type.as_deref() == Some("code-block") {
            let caption = nodes[index]
                .get("props")
                .and_then(Value::as_object)
                .and_then(|props| props.get("caption"))
                .and_then(Value::as_str)
                .map(str::trim)
                .map(str::to_string);
            if let Some(caption) = caption {
                let before = nodes[index].clone();
                if let Some(props) = nodes[index].get_mut("props").and_then(Value::as_object_mut) {
                    props.remove("caption");
                }
                if caption.is_empty() {
                    record_edit(
                        edits,
                        "renderer.empty_legacy_code_caption",
                        &format!("{node_path}.props.caption"),
                        "remove_empty_unsupported_caption",
                        Some(page_index),
                        &before,
                        &nodes[index],
                        "the removed unsupported caption is empty and carries no business content",
                    );
                    index += 1;
                    continue;
                }
                let node_id = nodes[index]
                    .get("id")
                    .and_then(Value::as_str)
                    .unwrap_or("code-block");
                let caption_id = unique_derived_id(node_id, "caption", ids);
                let group_id = unique_derived_id(node_id, "caption-group", ids);
                let caption_node = json!({
                    "id": caption_id,
                    "type": "text",
                    "props": {"text": caption}
                });
                let after_code = nodes[index].clone();
                let group = json!({
                    "id": group_id,
                    "type": "layout-group",
                    "kind": "cluster",
                    "layout": {
                        "variant": "stack",
                        "gap": "6pt",
                        "align": "stretch",
                        "cluster": true
                    },
                    "children": [caption_node, after_code]
                });
                nodes[index] = group.clone();
                record_edit(
                    edits,
                    "renderer.legacy_code_caption",
                    &format!("{node_path}.props.caption"),
                    "promote_caption_to_visible_text_sibling",
                    Some(page_index),
                    &before,
                    &group,
                    "the renderer ignores code-block.caption; a visible adjacent text node preserves the caption without modifying executable code",
                );
                index += 1;
                continue;
            }
        }
        index += 1;
    }
}

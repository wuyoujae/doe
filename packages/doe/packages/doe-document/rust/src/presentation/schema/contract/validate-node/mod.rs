// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_node
use super::*;


pub(super) fn validate_node(
    value: &Value,
    path: &str,
    group_depth: usize,
    node_ids: &mut HashSet<String>,
    node_count: &mut usize,
) -> Result<(), String> {
    *node_count += 1;
    if *node_count > MAX_NODES_PER_SLIDE {
        return mismatch(format!("{path} exceeds the per-slide node limit"));
    }
    let node = object(value, path)?;
    allowed_keys(
        node,
        &["id", "type", "props", "layout", "kind", "children"],
        path,
    )?;
    let id = identifier(required(node, "id", path)?, &format!("{path}.id"))?;
    if !node_ids.insert(id.to_string()) {
        return mismatch(format!("{path}.id must be unique within the Slide"));
    }
    let component_type = nonempty_text(required(node, "type", path)?, &format!("{path}.type"))?;
    if component_type == "layout-group" {
        if group_depth >= MAX_NODE_DEPTH {
            return mismatch(format!("{path} exceeds the maximum layout-group depth"));
        }
        if node.contains_key("props") {
            return mismatch(format!("{path}.props is not allowed on layout-group"));
        }
        let layout_path = format!("{path}.layout");
        let layout = required(node, "layout", path)?;
        object(layout, &layout_path)?;
        reject_theme_managed_component_styles(layout, &layout_path)?;
        if let Some(kind) = node.get("kind") {
            match kind.as_str() {
                Some("layout" | "container" | "collection" | "cluster") => {}
                _ => return mismatch(format!("{path}.kind is invalid")),
            }
        }
        let children = array(
            required(node, "children", path)?,
            &format!("{path}.children"),
        )?;
        if children.is_empty() || children.len() > MAX_GROUP_CHILDREN {
            return mismatch(format!(
                "{path}.children must contain between 1 and {MAX_GROUP_CHILDREN} nodes"
            ));
        }
        for (index, child) in children.iter().enumerate() {
            validate_node(
                child,
                &format!("{path}.children[{index}]"),
                group_depth + 1,
                node_ids,
                node_count,
            )?;
        }
        return Ok(());
    }

    if !COMPONENT_TYPES.contains(&component_type) {
        return mismatch(format!("{path}.type is not a supported component"));
    }
    if node.contains_key("kind") || node.contains_key("children") {
        return mismatch(format!(
            "{path}.kind and children are allowed only on layout-group"
        ));
    }
    let props = object(required(node, "props", path)?, &format!("{path}.props"))?;
    if let Some(layout) = node.get("layout") {
        let layout_path = format!("{path}.layout");
        object(layout, &layout_path)?;
        reject_theme_managed_component_styles(layout, &layout_path)?;
    }
    validate_component_props(component_type, props, &format!("{path}.props"))
}

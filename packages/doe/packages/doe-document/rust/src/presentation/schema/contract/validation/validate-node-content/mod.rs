// Origin: app/backend/core/src/slide_agent_output_contract/validation.rs::validate_node_content
use super::*;


pub(super) fn validate_node_content(
    value: &Value,
    path: &str,
    depth: usize,
    composition_depth: usize,
    ids: &mut HashSet<String>,
) -> Result<bool, String> {
    let node = object(value, path)?;
    let id = identifier(required(node, "id", path)?, &format!("{path}.id"))?;
    if !ids.insert(id.to_owned()) {
        return mismatch(format!("{path}.id must be unique within the Slide")).map(|()| false);
    }
    if ids.len() > MAX_NODES_PER_SLIDE {
        return mismatch(format!("{path} exceeds the per-slide node limit")).map(|()| false);
    }
    let kind = nonempty_text(required(node, "type", path)?, &format!("{path}.type"))?;
    if kind != "layout-group" {
        if !COMPONENT_TYPES.contains(&kind) {
            return mismatch(format!("{path}.type is not a supported component")).map(|()| false);
        }
        if node.contains_key("children") || node.contains_key("kind") {
            return mismatch(format!(
                "{path}.children and kind are allowed only on layout-group"
            ))
            .map(|()| false);
        }
        if kind == "notice" && composition_depth > 0 {
            return mismatch(format!("{path}.type notice cannot have a composition ancestor; move it outside that Group or use row, stack or columns")).map(|()| false);
        }
        let props_path = format!("{path}.props");
        object(required(node, "props", path)?, &props_path)?;
        // Theme-managed editor styles are not content. Strip them only in a
        // temporary validation view, never from the candidate being saved.
        let mut view = json!({"deck":{"slides":[{"blocks":[value]}]}});
        normalize_theme_managed_component_styles(&mut view);
        let props = view["deck"]["slides"][0]["blocks"][0]["props"]
            .as_object()
            .expect("checked props object");
        validate_component_props(kind, props, &props_path)?;
        if AUTHORABLE_COMPONENT_TYPES.contains(&kind) {
            validate_authorable_component_values(kind, props, &props_path)?;
        }
        if let Some(layout) = node.get("layout") {
            let layout_path = format!("{path}.layout");
            validate_authorable_leaf_layout(
                &fields(layout, &layout_path, &["span", "region"])?,
                &layout_path,
            )?;
        }
        return Ok(false);
    }
    if depth >= MAX_NODE_DEPTH {
        return mismatch(format!("{path} exceeds the maximum layout-group depth")).map(|()| false);
    }
    if node.contains_key("props") {
        return mismatch(format!("{path}.props is not allowed on layout-group")).map(|()| false);
    }
    validate_authorable_optional_enum(
        node,
        "kind",
        path,
        &["layout", "container", "collection", "cluster"],
    )?;
    let layout_path = format!("{path}.layout");
    let mut layout = fields(
        required(node, "layout", path)?,
        &layout_path,
        &[
            "variant",
            "direction",
            "ratio",
            "columns",
            "maxColumns",
            "align",
            "region",
            "mediaPosition",
            "mediaRatio",
            "mediaShape",
            "contentAlign",
        ],
    )?;
    // Explicit historical renderer aliases, used only by this validation view.
    match layout["variant"].as_str() {
        Some("compressed") => layout["variant"] = json!("composition"),
        Some("split-right-bleed") => layout["variant"] = json!("edge-media"),
        _ => {}
    }
    if layout.get("variant").is_none()
        && matches!(
            layout["direction"].as_str(),
            Some("vertical" | "horizontal")
        )
    {
        layout.as_object_mut().unwrap().remove("direction");
    }
    validate_authorable_group_layout(&layout, &layout_path)?;
    let edge = layout["variant"] == "edge-media";
    let composition_depth = composition_depth + usize::from(layout["variant"] == "composition");
    let children_path = format!("{path}.children");
    let children = array(required(node, "children", path)?, &children_path)?;
    if children.is_empty() || children.len() > MAX_GROUP_CHILDREN {
        return mismatch(format!(
            "{children_path} must contain between 1 and {MAX_GROUP_CHILDREN} nodes"
        ))
        .map(|()| false);
    }
    if edge
        && (depth != 0
            || children.len() != 2
            || children
                .iter()
                .filter(|child| child["layout"]["region"] == "content")
                .count()
                != 1
            || children
                .iter()
                .filter(|child| child["layout"]["region"] == "media" && child["type"] == "media")
                .count()
                != 1)
    {
        return mismatch(format!("{children_path} edge-media must be a root Group with exactly one content region and one media Leaf region")).map(|()| false);
    }
    for (index, child) in children.iter().enumerate() {
        validate_node_content(
            child,
            &format!("{children_path}[{index}]"),
            depth + 1,
            composition_depth,
            ids,
        )?;
    }
    Ok(edge)
}

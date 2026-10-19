// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_node
use super::*;


pub(super) fn validate_authorable_node(value: &Value, path: &str, is_root: bool) -> Result<bool, String> {
    let node = object(value, path)?;
    let node_type = node["type"].as_str().expect("validated Node type");
    if node_type == "layout-group" {
        let layout_path = format!("{path}.layout");
        let layout = required(node, "layout", path)?;
        validate_authorable_group_layout(layout, &layout_path)?;
        let edge_media = layout.get("variant").and_then(Value::as_str) == Some("edge-media");
        if edge_media && !is_root {
            return mismatch(format!("{path} edge-media Group must be a root Node"))
                .map(|()| false);
        }
        let children = node["children"]
            .as_array()
            .expect("validated Group children");
        if edge_media {
            if children.len() != 2 {
                return mismatch(format!(
                    "{path}.children must contain exactly two direct edge-media children"
                ))
                .map(|()| false);
            }
            let mut content_regions = 0usize;
            let mut media_regions = 0usize;
            for child in children {
                let region = child
                    .get("layout")
                    .and_then(Value::as_object)
                    .and_then(|layout| layout.get("region"))
                    .and_then(Value::as_str);
                content_regions += usize::from(region == Some("content"));
                media_regions += usize::from(
                    region == Some("media")
                        && child.get("type").and_then(Value::as_str) == Some("media"),
                );
            }
            if content_regions != 1 || media_regions != 1 {
                return mismatch(format!(
                    "{path}.children require one content region and one media Leaf region"
                ))
                .map(|()| false);
            }
        }
        for (index, child) in children.iter().enumerate() {
            validate_authorable_node(child, &format!("{path}.children[{index}]"), false)?;
        }
        return Ok(edge_media);
    }

    if !AUTHORABLE_COMPONENT_TYPES.contains(&node_type) {
        return mismatch(format!(
            "{path}.type is historical compatibility only and cannot be authored"
        ))
        .map(|()| false);
    }
    if let Some(layout) = node.get("layout") {
        validate_authorable_leaf_layout(layout, &format!("{path}.layout"))?;
    }
    let props = node["props"].as_object().expect("validated Leaf props");
    validate_authorable_component_shape(node_type, props, &format!("{path}.props"))?;
    validate_authorable_component_values(node_type, props, &format!("{path}.props"))?;
    Ok(false)
}

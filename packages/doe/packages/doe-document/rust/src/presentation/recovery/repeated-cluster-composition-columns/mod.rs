// Origin: app/backend/core/src/slide_recovery/mod.rs::repeated_cluster_composition_columns
use super::*;


pub(super) fn repeated_cluster_composition_columns(node: &Value) -> Option<usize> {
    let layout = node.get("layout")?.as_object()?;
    if layout.get("variant").and_then(Value::as_str) != Some("composition")
        || layout.get("direction").and_then(Value::as_str) != Some("row")
        || layout.get("lock").and_then(Value::as_str) == Some("structure")
        || layout
            .get("ratio")
            .is_some_and(|ratio| !ratio.is_null() && ratio.as_str() != Some("auto"))
    {
        return None;
    }
    let children = node.get("children")?.as_array()?;
    if !(3..=24).contains(&children.len())
        || children.iter().any(|child| {
            child.get("type").and_then(Value::as_str) != Some("layout-group")
                || (child.get("kind").and_then(Value::as_str) != Some("cluster")
                    && child
                        .get("layout")
                        .and_then(|value| value.get("cluster"))
                        .and_then(Value::as_bool)
                        != Some(true))
        })
    {
        return None;
    }
    let first_signature = node_structure_signature(children.first()?);
    if children
        .iter()
        .skip(1)
        .any(|child| node_structure_signature(child) != first_signature)
    {
        return None;
    }
    let max_columns = layout
        .get("maxColumns")
        .and_then(Value::as_u64)
        .and_then(|value| usize::try_from(value).ok())
        .unwrap_or(4)
        .clamp(1, 6);
    Some(children.len().min(max_columns))
}

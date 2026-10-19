// Origin: app/backend/core/src/plugin_slide_markdown.rs::collect_ids
use super::*;

// Include all known node IDs in redaction, including IDs referenced before their node.
pub(super) fn collect_ids<'a>(
    nodes: &'a [Value],
    ids: &mut Vec<&'a str>,
    depth: usize,
    remaining: &mut usize,
) -> Result<(), String> {
    if depth > 16 || nodes.len() > *remaining {
        return Err(TOO_LARGE.into());
    }
    *remaining -= nodes.len();
    for node in nodes {
        if !node.is_object() {
            return Err(UNAVAILABLE.into());
        }
        if let Some(id) = node.get("id").and_then(Value::as_str) {
            ids.push(id);
        }
        if node["type"] == "layout-group" {
            collect_ids(array(&node["children"])?, ids, depth + 1, remaining)?;
        }
    }
    Ok(())
}

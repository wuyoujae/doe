// Origin: app/backend/core/src/doe_slide_edit/operations.rs::find
use super::*;


pub(super) fn find<'a>(nodes: &'a mut [Value], id: &str) -> Option<&'a mut Value> {
    for node in nodes {
        if node.get("id").and_then(Value::as_str) == Some(id) {
            return Some(node);
        }
        if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
            if let Some(found) = find(children, id) {
                return Some(found);
            }
        }
    }
    None
}

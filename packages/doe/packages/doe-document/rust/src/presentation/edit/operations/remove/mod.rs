// Origin: app/backend/core/src/doe_slide_edit/operations.rs::remove
use super::*;


pub(super) fn remove(nodes: &mut Vec<Value>, id: &str, replacement: Option<&Value>) -> bool {
    if let Some(index) = nodes.iter().position(|n| n["id"] == id) {
        if let Some(node) = replacement {
            nodes[index] = node.clone();
        } else {
            nodes.remove(index);
        }
        return true;
    }
    nodes.iter_mut().any(|n| {
        n.get_mut("children")
            .and_then(Value::as_array_mut)
            .is_some_and(|children| remove(children, id, replacement))
    })
}

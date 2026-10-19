// Origin: app/backend/core/src/slide_recovery/mod.rs::node_structure_signature
use super::*;


pub(super) fn node_structure_signature(node: &Value) -> Vec<String> {
    let mut signature = vec![node
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string()];
    if let Some(children) = node.get("children").and_then(Value::as_array) {
        for child in children {
            signature.extend(node_structure_signature(child));
        }
    }
    signature
}

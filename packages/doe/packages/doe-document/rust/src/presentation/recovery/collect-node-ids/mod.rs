// Origin: app/backend/core/src/slide_recovery/mod.rs::collect_node_ids
use super::*;


pub(super) fn collect_node_ids(nodes: &[Value], output: &mut BTreeSet<String>) {
    for node in nodes {
        if let Some(id) = node.get("id").and_then(Value::as_str) {
            output.insert(id.to_string());
        }
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            collect_node_ids(children, output);
        }
    }
}

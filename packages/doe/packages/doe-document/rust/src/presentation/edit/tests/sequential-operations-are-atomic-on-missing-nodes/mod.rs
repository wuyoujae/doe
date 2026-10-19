// Origin: app/backend/core/src/doe_slide_edit/tests.rs::sequential_operations_are_atomic_on_missing_nodes
use super::*;


#[test]
pub(super) fn sequential_operations_are_atomic_on_missing_nodes() {
    let source = page();
    let input = serde_json::from_value(json!({"operations":[
        {"op":"remove_node","node_id":"n1"},
        {"op":"set","node_id":"missing","path":"/props/text","value":"bad"}
    ]}))
    .unwrap();
    assert!(apply(&source, &input).is_err());
    assert_eq!(source, page());
}

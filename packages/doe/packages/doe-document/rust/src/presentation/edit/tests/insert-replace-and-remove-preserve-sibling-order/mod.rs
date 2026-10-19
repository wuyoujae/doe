// Origin: app/backend/core/src/doe_slide_edit/tests.rs::insert_replace_and_remove_preserve_sibling_order
use super::*;


#[test]
pub(super) fn insert_replace_and_remove_preserve_sibling_order() {
    let input=serde_json::from_value(json!({"operations":[
        {"op":"insert_node","parent_id":"g1","before_id":"n2","node":{"id":"n3","type":"text","props":{"text":"new"}}},
        {"op":"replace_node","node_id":"n1","node":{"id":"n1","type":"text","props":{"text":"replaced"}}},
        {"op":"remove_node","node_id":"n2"}
    ]})).unwrap();
    let result = apply(&page(), &input).unwrap();
    let children = result["blocks"][0]["children"].as_array().unwrap();
    assert_eq!(children.len(), 2);
    assert_eq!(children[0]["id"], "n1");
    assert_eq!(children[1]["id"], "n3");
}

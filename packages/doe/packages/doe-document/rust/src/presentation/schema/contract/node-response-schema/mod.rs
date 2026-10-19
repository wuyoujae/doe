// Origin: app/backend/core/src/slide_agent_output_contract.rs::node_response_schema
use super::*;


pub(super) fn node_response_schema(depth: usize) -> Value {
    let leaf_variants = AUTHORABLE_COMPONENT_TYPES
        .iter()
        .map(|component_type| component_response_schema(component_type))
        .collect::<Vec<_>>();
    let leaf = json!({"anyOf": leaf_variants});
    if depth >= MAX_NODE_DEPTH {
        return leaf;
    }
    let group = json!({
        "type": "object",
        "properties": {
            "id": {"type": "string", "minLength": 1, "maxLength": 128},
            "type": {"type": "string", "enum": ["layout-group"]},
            "kind": {
                "type": "string",
                "enum": ["layout", "container", "collection", "cluster"]
            },
            "layout": {"type": "object", "additionalProperties": true},
            "children": {
                "type": "array",
                "minItems": 1,
                "maxItems": MAX_GROUP_CHILDREN,
                "items": node_response_schema(depth + 1)
            }
        },
        "required": ["id", "type", "layout", "children"],
        "additionalProperties": false
    });
    json!({"anyOf": [leaf, group]})
}

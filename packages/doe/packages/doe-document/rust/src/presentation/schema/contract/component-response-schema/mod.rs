// Origin: app/backend/core/src/slide_agent_output_contract.rs::component_response_schema
use super::*;


pub(super) fn component_response_schema(component_type: &str) -> Value {
    json!({
        "type": "object",
        "properties": {
            "id": {"type": "string", "minLength": 1, "maxLength": 128},
            "type": {"type": "string", "enum": [component_type]},
            "props": component_props_response_schema(component_type),
            "layout": {"type": "object", "additionalProperties": true},
        },
        "required": ["id", "type", "props"],
        "additionalProperties": false
    })
}

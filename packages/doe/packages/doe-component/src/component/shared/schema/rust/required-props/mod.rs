// Origin: app/backend/core/src/slide_agent_output_contract.rs::required_props
use crate::schema::*;


pub fn required_props(properties: Value, required: &[&str]) -> Value {
    json!({
        "type": "object",
        "properties": properties,
        "required": required,
        "additionalProperties": true
    })
}

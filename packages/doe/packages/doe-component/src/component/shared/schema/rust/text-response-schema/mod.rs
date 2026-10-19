// Origin: app/backend/core/src/slide_agent_output_contract.rs::text_response_schema
use crate::schema::*;


pub fn text_response_schema() -> Value {
    json!({"type": "string", "minLength": 1, "maxLength": 20_000})
}

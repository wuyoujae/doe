// Component contract from component_props_response_schema: "stat"
use crate::schema::*;

pub(crate) fn component_props_response_schema_stat() -> Value {
    required_props(
            json!({"value": {"anyOf": [text_response_schema(), {"type": "number"}]}}),
            &["value"],
        )
}

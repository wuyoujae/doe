// Component contract from component_props_response_schema: "code-block"
use crate::schema::*;

pub(crate) fn component_props_response_schema_code_block() -> Value {
    required_props(json!({"code": text_response_schema()}), &["code"])
}

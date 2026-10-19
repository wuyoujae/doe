// Component contract from component_props_response_schema: "math-formula"
use crate::schema::*;

pub(crate) fn component_props_response_schema_math_formula() -> Value {
    required_props(
            json!({
                "content": required_props(
                    json!({"formula": text_response_schema()}),
                    &["formula"]
                )
            }),
            &["content"],
        )
}

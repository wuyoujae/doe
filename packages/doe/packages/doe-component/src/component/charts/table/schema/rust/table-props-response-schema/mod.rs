// Origin: app/backend/core/src/slide_agent_output_contract.rs::table_props_response_schema
use crate::schema::*;


pub fn table_props_response_schema() -> Value {
    let columns = json!({
        "type": "array",
        "minItems": 1,
        "maxItems": 12,
        "items": required_props(json!({"header": text_response_schema()}), &["header"])
    });
    let rows = json!({
        "type": "array",
        "minItems": 1,
        "items": required_props(
            json!({"cells": {"type": "array", "minItems": 1, "maxItems": 12}}),
            &["cells"]
        )
    });
    required_props(
        json!({
            "content": required_props(json!({"columns": columns, "rows": rows}), &["columns", "rows"])
        }),
        &["content"],
    )
}

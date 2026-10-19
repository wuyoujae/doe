// Component contract from component_props_response_schema: "list" | "ordered-list"
use crate::schema::*;

pub(crate) fn component_props_response_schema_list_ordered_list() -> Value {
    required_props(
            json!({
                "items": {
                    "type": "array",
                    "minItems": 1,
                    "maxItems": 100,
                    "items": text_response_schema()
                }
            }),
            &["items"],
        )
}

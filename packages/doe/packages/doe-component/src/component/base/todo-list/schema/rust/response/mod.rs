// Component contract from component_props_response_schema: "todo-list"
use crate::schema::*;

pub(crate) fn component_props_response_schema_todo_list() -> Value {
    required_props(json!({"items": {
            "type": "array", "minItems": 1, "maxItems": 100,
            "items": required_props(json!({"text": text_response_schema(), "checked": {"type": "boolean"}}), &["text", "checked"])
        }}), &["items"])
}

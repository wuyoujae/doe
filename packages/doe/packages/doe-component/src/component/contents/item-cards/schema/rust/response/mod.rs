// Component contract from component_props_response_schema: "item-cards"
use crate::schema::*;

pub(crate) fn component_props_response_schema_item_cards() -> Value {
    required_props(json!({"items": {
            "type": "array", "minItems": 1, "maxItems": 12,
            "items": required_props(json!({"title": text_response_schema(), "text": text_response_schema()}), &["title", "text"])
        }}), &["items"])
}

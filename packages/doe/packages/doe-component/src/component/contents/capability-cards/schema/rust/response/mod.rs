// Component contract from component_props_response_schema: "capability-cards"
use crate::schema::*;

pub(crate) fn component_props_response_schema_capability_cards() -> Value {
    collection_props_response_schema(
            "items",
            1,
            6,
            json!({"title": text_response_schema(), "text": text_response_schema()}),
            &["title", "text"],
        )
}

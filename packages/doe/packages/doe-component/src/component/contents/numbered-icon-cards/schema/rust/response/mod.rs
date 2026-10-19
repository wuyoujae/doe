// Component contract from component_props_response_schema: "numbered-icon-cards"
use crate::schema::*;

pub(crate) fn component_props_response_schema_numbered_icon_cards() -> Value {
    collection_props_response_schema(
            "items",
            2,
            6,
            json!({
                "title": text_response_schema(),
                "text": text_response_schema(),
                "icon": text_response_schema()
            }),
            &["title", "text", "icon"],
        )
}

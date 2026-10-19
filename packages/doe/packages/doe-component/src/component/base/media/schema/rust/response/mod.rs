// Component contract from component_props_response_schema: "media"
use crate::schema::*;

pub(crate) fn component_props_response_schema_media() -> Value {
    required_props(
            json!({"src": text_response_schema(), "alt": text_response_schema()}),
            &["src", "alt"],
        )
}

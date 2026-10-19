// Component contract from component_props_response_schema: "hero"
use crate::schema::*;

pub(crate) fn component_props_response_schema_hero() -> Value {
    required_props(json!({"title": text_response_schema()}), &["title"])
}

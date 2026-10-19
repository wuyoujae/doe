// Component contract from component_props_response_schema: "icon-text"
use crate::schema::*;

pub(crate) fn component_props_response_schema_icon_text() -> Value {
    required_props(json!({"icon":text_response_schema(),"title":text_response_schema(),"text":text_response_schema()}), &["icon","title","text"])
}

// Component contract from component_props_response_schema: "question-card"
use crate::schema::*;

pub(crate) fn component_props_response_schema_question_card() -> Value {
    required_props(json!({"title": text_response_schema(), "icon": text_response_schema()}), &["title"])
}

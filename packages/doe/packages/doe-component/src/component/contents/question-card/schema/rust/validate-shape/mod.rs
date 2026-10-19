// Component contract from validate_authorable_component_shape: "question-card"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_question_card(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["title", "index", "text", "icon"], path)
}

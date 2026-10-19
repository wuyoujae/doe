// Component contract from validate_component_props: "question-card"
use crate::schema::*;

pub(crate) fn validate_component_props_question_card(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    required_text(props, "title", path)?;
    validate_authorable_optional_text(props, "icon", path)
}

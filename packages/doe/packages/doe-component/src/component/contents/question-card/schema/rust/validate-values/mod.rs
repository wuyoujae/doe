// Component contract from validate_authorable_component_values: "question-card"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_question_card(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_authorable_optional_string_or_number(props, "index", path)?;
            validate_authorable_optional_text(props, "icon", path)?;
            validate_authorable_optional_text(props, "text", path)
        }
}

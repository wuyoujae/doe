// Component contract from validate_authorable_component_values: "quote"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_quote(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_optional_text(props, "source", path)
}

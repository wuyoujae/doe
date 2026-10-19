// Component contract from validate_authorable_component_values: "text"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_text(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    required_text(props, "text", path)
}

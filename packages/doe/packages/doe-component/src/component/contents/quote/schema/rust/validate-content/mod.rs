// Component contract from validate_component_props: "quote"
use crate::schema::*;

pub(crate) fn validate_component_props_quote(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    required_text(props, "text", path)
}

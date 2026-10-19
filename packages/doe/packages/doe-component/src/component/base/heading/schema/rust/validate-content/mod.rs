// Component contract from validate_component_props: "heading"
use crate::schema::*;

pub(crate) fn validate_component_props_heading(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    required_text(props, "text", path)
}

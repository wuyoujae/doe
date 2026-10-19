// Component contract from validate_component_props: "text" | "notice"
use crate::schema::*;

pub(crate) fn validate_component_props_text_notice(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    required_text(props, "text", path)
}

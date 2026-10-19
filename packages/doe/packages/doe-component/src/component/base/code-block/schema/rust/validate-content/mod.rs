// Component contract from validate_component_props: "code-block"
use crate::schema::*;

pub(crate) fn validate_component_props_code_block(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    required_text(props, "code", path)
}

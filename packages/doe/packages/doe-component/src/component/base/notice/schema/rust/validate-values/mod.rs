// Component contract from validate_authorable_component_values: "notice"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_notice(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_optional_text(props, "icon", path)
}

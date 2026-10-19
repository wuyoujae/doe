// Component contract from validate_authorable_component_shape: "notice"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_notice(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["text", "icon"], path)
}

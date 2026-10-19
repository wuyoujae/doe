// Component contract from validate_authorable_component_shape: "heading"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_heading(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["text", "level", "kicker", "variant"], path)
}

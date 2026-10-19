// Component contract from validate_authorable_component_shape: "text"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_text(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["text"], path)
}

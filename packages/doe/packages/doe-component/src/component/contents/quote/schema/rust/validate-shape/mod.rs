// Component contract from validate_authorable_component_shape: "quote"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_quote(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["text", "source"], path)
}

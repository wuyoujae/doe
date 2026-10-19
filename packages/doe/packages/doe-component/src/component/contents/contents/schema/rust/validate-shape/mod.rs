// Component contract from validate_authorable_component_shape: "contents"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_contents(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    contents::validate(props, path)
}

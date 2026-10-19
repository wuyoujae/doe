// Component contract from validate_authorable_component_shape: "stat"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_stat(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["value", "label", "description"], path)
}

// Component contract from validate_authorable_component_shape: "hero"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_hero(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["title", "eyebrow", "subtitle", "icon", "align"], path)
}

// Component contract from validate_component_props: "hero"
use crate::schema::*;

pub(crate) fn validate_component_props_hero(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    required_text(props, "title", path)
}

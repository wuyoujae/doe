// Component contract from validate_component_props: "contents"
use crate::schema::*;

pub(crate) fn validate_component_props_contents(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    contents::validate(props, path)
}

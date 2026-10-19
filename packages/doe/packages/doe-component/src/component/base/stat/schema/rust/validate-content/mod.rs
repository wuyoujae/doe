// Component contract from validate_component_props: "stat"
use crate::schema::*;

pub(crate) fn validate_component_props_stat(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    string_or_number(required(props, "value", path)?, &format!("{path}.value"))
}

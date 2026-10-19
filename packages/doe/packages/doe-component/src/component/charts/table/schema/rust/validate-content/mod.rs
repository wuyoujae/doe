// Component contract from validate_component_props: "table"
use crate::schema::*;

pub(crate) fn validate_component_props_table(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_table(props, path)
}

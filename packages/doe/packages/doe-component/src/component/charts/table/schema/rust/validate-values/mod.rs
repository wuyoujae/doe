// Component contract from validate_authorable_component_values: "table"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_table(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_table_values(props, path)
}

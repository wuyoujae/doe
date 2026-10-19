// Component contract from validate_authorable_component_values: "donut-chart"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_donut_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_donut_values(props, path)
}

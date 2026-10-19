// Component contract from validate_authorable_component_values: "waterfall-chart"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_waterfall_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_waterfall_values(props, path)
}

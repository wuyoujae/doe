// Component contract from validate_authorable_component_values: "radar-chart"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_radar_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_radar_values(props, path)
}

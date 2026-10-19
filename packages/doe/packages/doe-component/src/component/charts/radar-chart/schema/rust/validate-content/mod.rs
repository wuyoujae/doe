// Component contract from validate_component_props: "radar-chart"
use crate::schema::*;

pub(crate) fn validate_component_props_radar_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_radar_chart(props, path)
}

// Component contract from validate_authorable_component_values: "grouped-bar-chart" | "line-chart" | "stacked-bar-chart"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_grouped_bar_chart_line_chart_stacked_bar_chart(component_type: &str, props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_authorable_series_chart_values(component_type, props, path)
        }
}

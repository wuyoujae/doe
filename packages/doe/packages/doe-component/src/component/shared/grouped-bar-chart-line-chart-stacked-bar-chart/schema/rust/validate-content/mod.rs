// Component contract from validate_component_props: "grouped-bar-chart" | "line-chart" | "stacked-bar-chart"
use crate::schema::*;

pub(crate) fn validate_component_props_grouped_bar_chart_line_chart_stacked_bar_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_series_chart(props, path)
        }
}

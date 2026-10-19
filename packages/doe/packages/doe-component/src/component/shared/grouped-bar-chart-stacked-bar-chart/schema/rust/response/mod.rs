// Component contract from component_props_response_schema: "grouped-bar-chart" | "stacked-bar-chart"
use crate::schema::*;

pub(crate) fn component_props_response_schema_grouped_bar_chart_stacked_bar_chart() -> Value {
    series_chart_props_response_schema(true)
}

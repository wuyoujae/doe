// Component contract from component_props_response_schema: "line-chart"
use crate::schema::*;

pub(crate) fn component_props_response_schema_line_chart() -> Value {
    series_chart_props_response_schema(false)
}

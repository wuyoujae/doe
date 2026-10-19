// Component contract from component_props_response_schema: "donut-chart"
use crate::schema::*;

pub(crate) fn component_props_response_schema_donut_chart() -> Value {
    collection_props_response_schema(
            "items",
            2,
            6,
            json!({"label": text_response_schema(), "value": {"type": "number", "minimum": 0}}),
            &["label", "value"],
        )
}

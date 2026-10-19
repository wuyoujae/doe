// Component contract from component_props_response_schema: "waterfall-chart"
use crate::schema::*;

pub(crate) fn component_props_response_schema_waterfall_chart() -> Value {
    collection_props_response_schema(
            "items",
            2,
            100,
            json!({"label": text_response_schema(), "value": {"type": "number"}}),
            &["label", "value"],
        )
}

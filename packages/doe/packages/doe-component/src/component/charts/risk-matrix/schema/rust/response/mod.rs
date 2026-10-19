// Component contract from component_props_response_schema: "risk-matrix"
use crate::schema::*;

pub(crate) fn component_props_response_schema_risk_matrix() -> Value {
    collection_props_response_schema(
            "items",
            1,
            100,
            json!({
                "label": text_response_schema(),
                "x": {"type": "number", "minimum": 0, "maximum": 1},
                "y": {"type": "number", "minimum": 0, "maximum": 1}
            }),
            &["label", "x", "y"],
        )
}

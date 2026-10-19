// Origin: app/backend/core/src/slide_agent_output_contract.rs::radar_chart_props_response_schema
use crate::schema::*;


pub fn radar_chart_props_response_schema() -> Value {
    let axes = json!({
        "type": "array",
        "minItems": 3,
        "maxItems": 8,
        "items": required_props(
            json!({
                "label": text_response_schema(),
                "max": {"type": "number", "exclusiveMinimum": 0}
            }),
            &["label", "max"]
        )
    });
    let datasets = json!({
        "type": "array",
        "minItems": 1,
        "maxItems": 3,
        "items": required_props(
            json!({
                "name": text_response_schema(),
                "values": {"type": "array", "minItems": 3, "maxItems": 8, "items": {"type": "number"}}
            }),
            &["name", "values"]
        )
    });
    required_props(
        json!({
            "content": required_props(json!({"axes": axes, "datasets": datasets}), &["axes", "datasets"])
        }),
        &["content"],
    )
}

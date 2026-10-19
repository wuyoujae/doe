// Origin: app/backend/core/src/slide_agent_output_contract.rs::series_chart_props_response_schema
use crate::schema::*;


pub fn series_chart_props_response_schema(non_negative: bool) -> Value {
    let categories = json!({
        "type": "array",
        "minItems": 1,
        "maxItems": 100,
        "items": text_response_schema()
    });
    let data_value = if non_negative {
        json!({"type": "number", "minimum": 0})
    } else {
        json!({"type": "number"})
    };
    let series = json!({
        "type": "array",
        "minItems": 1,
        "items": required_props(
            json!({
                "name": text_response_schema(),
                "data": {"type": "array", "minItems": 1, "maxItems": 100, "items": data_value}
            }),
            &["name", "data"]
        )
    });
    required_props(
        json!({
            "content": required_props(
                json!({"categories": categories, "series": series}),
                &["categories", "series"]
            )
        }),
        &["content"],
    )
}

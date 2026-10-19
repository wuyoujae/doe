// Component contract from component_props_response_schema: "shape-contents"
use crate::schema::*;

pub(crate) fn component_props_response_schema_shape_contents() -> Value {
    required_props(json!({
            "variant": {"type":"string", "enum":["semicircle","petals","cycle-arrows","full-circle","ring","stairs","pyramid","inverted-pyramid"]},
            "items": {"type":"array", "minItems":2, "maxItems":12,
                "items":required_props(json!({"title":text_response_schema(),"text":text_response_schema(),"icon":text_response_schema()}), &["title","text"])}
        }), &["variant","items"])
}

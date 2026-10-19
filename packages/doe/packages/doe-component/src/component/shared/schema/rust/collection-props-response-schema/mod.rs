// Origin: app/backend/core/src/slide_agent_output_contract.rs::collection_props_response_schema
use crate::schema::*;


pub fn collection_props_response_schema(
    key: &str,
    min_items: usize,
    max_items: usize,
    item_properties: Value,
    item_required: &[&str],
) -> Value {
    let mut content_properties = Map::new();
    content_properties.insert(
        key.to_string(),
        json!({
            "type": "array",
            "minItems": min_items,
            "maxItems": max_items,
            "items": required_props(item_properties, item_required)
        }),
    );
    required_props(
        json!({
            "content": required_props(Value::Object(content_properties), &[key])
        }),
        &["content"],
    )
}

// Component contract from component_props_response_schema: "heading" | "text" | "quote" | "notice"
use crate::schema::*;

pub(crate) fn component_props_response_schema_heading_text_quote_notice(component_type: &str) -> Value {
    let mut properties = json!({"text": text_response_schema()});
    if component_type == "heading" {
        properties["variant"] = json!({"type":"string","enum":["section","plain","display"]});
    }
    required_props(properties, &["text"])
}

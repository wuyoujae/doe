// Component contract from component_props_response_schema: "image-text"
use crate::schema::*;

pub(crate) fn component_props_response_schema_image_text() -> Value {
    required_props(json!({
        "src":text_response_schema(),"alt":text_response_schema(),"title":text_response_schema(),"text":text_response_schema(),
        "imageSize":{"type":"string","enum":["compact","full"]},
        "imageFit":{"type":"string","enum":["contain","cover"]},
        "imageAspectRatio":{"type":"string","enum":["1:1","4:3","3:4","16:9"]},
        "surface":{"type":"string","enum":["none","soft"]}
    }), &["src","alt","title","text"])
}

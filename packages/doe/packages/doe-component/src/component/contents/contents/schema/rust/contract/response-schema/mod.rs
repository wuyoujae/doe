// Origin: app/backend/core/src/slide_agent_output_contract/contents.rs::response_schema
use super::*;


pub(in super::super) fn response_schema() -> Value {
    required_props(
        json!({
            "presentation": {"type":"string","enum":PRESENTATIONS},
            "items": {"type":"array","minItems":1,"maxItems":12,"items":{"type":"object","additionalProperties":false,"required":["id"],"properties":{
                "id":{"type":"string","minLength":1},"title":{"type":"string"},"text":{"type":"string"},"icon":{"type":"string"},"src":{"type":"string"},"alt":{"type":"string"},"source":{"type":"string"},"label":{"anyOf":[{"type":"string"},{"type":"number"}]},"bullets":{"type":"array","items":{"type":"string"}}
            }}},
            "title":{"type":"string"},"subtitle":{"type":"string"},
            "itemLayout":{"type":"string","enum":["auto","stack","grid"]},
            "orientation":{"type":"string","enum":["vertical","horizontal"]},
            "staggered":{"type":"boolean"},"connectors":{"type":"boolean"},
            "imageSize":{"type":"string","enum":["compact","full"],"description":"Only for presentation image-text."},
            "imageFit":{"type":"string","enum":["contain","cover"],"description":"Only for presentation image-text."},
            "imageAspectRatio":{"type":"string","enum":["1:1","4:3","3:4","16:9"],"description":"Only for presentation image-text."},
            "surface":{"type":"string","enum":["none","soft"],"description":"Only for presentation image-text."},
            "itemColumns":{"anyOf":[{"const":"auto"},{"type":"integer","minimum":1,"maximum":12}]},
            "columnPreference":{"anyOf":[{"const":"auto"},{"type":"integer","minimum":1,"maximum":12}]}
        }),
        &["presentation", "items"],
    )
}

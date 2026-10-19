// Origin: app/backend/core/src/slide_recovery/tests.rs::valid_slide
use super::*;


pub(super) fn valid_slide(id: &str, text: &str) -> Value {
    json!({
        "id": id,
        "size": {"width": 960, "height": 540, "unit": "pt"},
        "blocks": [{
            "id": format!("{id}-heading"),
            "type": "heading",
            "props": {"text": text}
        }]
    })
}

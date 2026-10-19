// Origin: app/backend/core/src/slide_recovery/model_io.rs::page_repair_response_format
use super::*;


pub(super) fn page_repair_response_format(slide_schema: &Value, target_count: usize) -> Value {
    json!({
        "type": "json_schema",
        "json_schema": {
            "name": "yrkie_slide_page_repair_v1",
            "strict": true,
            "schema": {
                "type": "object",
                "properties": {
                    "base_deck_sha256": {"type": "string", "minLength": 64, "maxLength": 64},
                    "repairs": {
                        "type": "array",
                        "minItems": target_count,
                        "maxItems": target_count,
                        "items": {
                            "type": "object",
                            "properties": {
                                "page_index": {"type": "integer", "minimum": 0},
                                "expected_page_sha256": {"type": "string", "minLength": 64, "maxLength": 64},
                                "slide": slide_schema,
                            },
                            "required": ["page_index", "expected_page_sha256", "slide"],
                            "additionalProperties": false
                        }
                    }
                },
                "required": ["base_deck_sha256", "repairs"],
                "additionalProperties": false
            }
        }
    })
}

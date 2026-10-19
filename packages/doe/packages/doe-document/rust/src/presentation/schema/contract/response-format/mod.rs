// Origin: app/backend/core/src/slide_agent_output_contract.rs::response_format
use super::*;


pub fn response_format(expectations: SlideDeckExpectations) -> Value {
    json!({
        "type": "json_schema",
        "json_schema": {
            "name": "yrkie_slide_deck_v4",
            "strict": true,
            "schema": {
                "type": "object",
                "properties": {
                    "version": {"type": "integer"},
                    "logo": {"type": ["object", "null"], "properties": {"src": {"type": "string"}}, "required": ["src"], "additionalProperties": false},
                    "pageNumber": {
                        "type": "object",
                        "properties": {
                            "enabled": {"type": "boolean"},
                            "format": {"type": "string", "enum": ["number", "fraction"]}
                        },
                        "required": ["enabled", "format"],
                        "additionalProperties": false
                    },
                    "deck": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "minLength": 1, "maxLength": 200},
                            "theme": {"type": "string", "enum": registered_theme_ids()},
                            "slides": {
                                "type": "array",
                                "minItems": expectations.slide_count,
                                "maxItems": expectations.slide_count,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {"type": "string", "minLength": 1, "maxLength": 128},
                                        "size": {
                                            "type": "object",
                                            "properties": {
                                                "width": {"type": "integer"},
                                                "height": {"type": "integer"},
                                                "unit": {"type": "string", "enum": ["pt"]}
                                            },
                                            "required": ["width", "height", "unit"],
                                            "additionalProperties": false
                                        },
                                        "logo": {"type": ["object", "null"], "properties": {"src": {"type": "string"}}, "required": ["src"], "additionalProperties": false},
                                        "background": {"type": ["object", "null"], "properties": {"contentWidth": {"type": "number", "minimum": 0.2, "maximum": 1}, "textSurface": {"type":"string","enum":["auto","none"]}}, "additionalProperties": true},
                                        "layout": {"type": ["object", "null"], "additionalProperties": true},
                                        "blocks": {
                                            "type": "array",
                                            "minItems": 1,
                                            "maxItems": MAX_NODES_PER_SLIDE,
                                            "items": node_response_schema(0)
                                        }
                                    },
                                    "required": ["id", "size", "blocks"],
                                    "additionalProperties": false
                                }
                            }
                        },
                        "required": ["title", "theme", "slides"],
                        "additionalProperties": false
                    }
                },
                "required": ["version", "pageNumber", "deck"],
                "additionalProperties": false
            }
        }
    })
}

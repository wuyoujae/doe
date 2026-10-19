use super::*;
#[test]
    fn doe_production_decoder_rejects_ambiguous_multiple_json_documents() {
        let raw = r#"{"outline":{"body":[{"contents":["第一页"]}]}} {"outline":{"body":[{"contents":["第二页"]}]}}"#;

        let error = decode_doe_traditional_outline_without_schema_validation(raw)
            .expect_err("multiple roots cannot be normalized without choosing content");

        assert!(error.starts_with(INVALID_JSON_ERROR));
    }

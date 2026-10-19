use super::*;
#[test]
    fn doe_production_decoder_accepts_unknown_and_non_v1_content_without_validation() {
        let output = json!({
            "operation": "invented-operation",
            "expected_revision": "not-a-revision",
            "outline": {
                "unknown": {"business": "Retain this"},
                "slides": [{
                    "page_number": "wrong",
                    "contents": {
                        "title": {"body": "Converted title"},
                        "future": {"body": 42}
                    }
                }]
            },
            "unknownEnvelopeField": true
        });

        let decoded =
            decode_doe_traditional_outline_without_schema_validation(&output.to_string()).unwrap();
        assert_eq!(decoded.operation, OutlineOperation::Create);
        assert_eq!(decoded.expected_revision, None);
        assert_eq!(decoded.outline.title, "Converted title");
        assert_eq!(
            decoded.outline.body[0].contents,
            vec!["Converted title".to_string(), "42".to_string()]
        );
        assert!(decoded.outline.slides.is_none());

        decode_doe_traditional_outline(&output.to_string())
            .expect_err("strict DOE decoder remains available for diagnostics");
    }

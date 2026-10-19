use super::*;
#[test]
    fn doe_direct_decoder_rejects_schema_v2_and_unknown_envelope_fields() {
        let v2 = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{"page_number": 1, "contents": {}}]}
        });
        let error = decode_doe_traditional_outline(&v2.to_string())
            .expect_err("DOE must use traditional V1");
        assert!(error.starts_with(SCHEMA_MISMATCH_ERROR));

        let unknown = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"title": "A", "page_count": 1, "body": [{"contents": ["A"]}]},
            "repair": true
        });
        assert!(decode_doe_traditional_outline(&unknown.to_string()).is_err());
    }

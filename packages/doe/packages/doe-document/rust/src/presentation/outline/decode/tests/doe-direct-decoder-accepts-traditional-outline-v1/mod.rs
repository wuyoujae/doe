use super::*;
#[test]
    fn doe_direct_decoder_accepts_traditional_outline_v1() {
        let output = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {
                "title": "Product launch",
                "page_count": 1,
                "body": [{"index": 1, "page": 1, "contents": ["Cover"]}]
            }
        });

        let decoded =
            decode_doe_traditional_outline(&output.to_string()).expect("DOE traditional output");
        assert_eq!(decoded.operation, OutlineOperation::Create);
        assert_eq!(decoded.expected_revision, None);
        assert_eq!(decoded.outline.title, "Product launch");
        assert_eq!(decoded.outline.body[0].contents, vec!["Cover"]);
        assert!(decoded.outline.slides.is_none());
    }

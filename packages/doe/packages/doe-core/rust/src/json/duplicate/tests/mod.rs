
    use super::*;
    use serde_json::json;

    #[test]
    fn preserves_unique_json_and_reports_nested_duplicates() {
        let parsed = parse(r#"{"a":1,"nested":{"x":2,"x":2},"items":[{"y":3,"y":4}]}"#).unwrap();
        assert_eq!(parsed.value["nested"], json!({"x": 2}));
        assert_eq!(parsed.equal_paths, vec!["/nested/x"]);
        assert_eq!(parsed.conflicting_paths, vec!["/items/0/y"]);
    }

    #[test]
    fn strict_parser_rejects_equal_and_conflicting_duplicates() {
        assert!(parse_strict(r#"{"a":1}"#).is_ok());
        assert!(parse_strict(r#"{"a":1,"a":1}"#).is_err());
        assert!(parse_strict(r#"{"a":1,"a":2}"#).is_err());
    }

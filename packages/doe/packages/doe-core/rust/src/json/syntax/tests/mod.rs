
    use super::*;
    use serde_json::json;

    fn repaired(raw: &str) -> (Value, JsonSyntaxRepairReport) {
        parse_json_with_syntax_repair(raw).expect("repairable JSON")
    }

    #[test]
    fn repairs_common_structural_and_lexical_json_errors() {
        let cases = [
            (r#"{"a":1 "b":2}"#, json!({"a": 1, "b": 2})),
            (r#"{"a" 1}"#, json!({"a": 1})),
            (r#"{"a":[1,2}}"#, json!({"a": [1, 2]})),
            (r#"{"a":1,}"#, json!({"a": 1})),
            (r#"{a:1}"#, json!({"a": 1})),
            (r#"{'a':'b'}"#, json!({"a": "b"})),
            ("{“a”:“b”}", json!({"a": "b"})),
            (
                "{\"a\":\"line one\nline two\"}",
                json!({"a": "line one\nline two"}),
            ),
            (
                r#"{"a":"He said "hello"."}"#,
                json!({"a": "He said \"hello\"."}),
            ),
            ("\u{feff}{\"a\":1}", json!({"a": 1})),
        ];
        for (raw, expected) in cases {
            let (value, report) =
                parse_json_with_syntax_repair(raw).unwrap_or_else(|error| panic!("{raw}: {error}"));
            assert_eq!(value, expected, "{raw}");
            assert!(report.count() > 0, "{raw}");
        }
    }

    #[test]
    fn repairs_missing_string_boundary_before_structural_suffix() {
        let raw = r#"{"slides":[{"contents_json":"{\"title\":{\"body\":\"A\"}}}]}}"#;
        assert!(parse_json_with_syntax_repair(raw).is_err());
        let (value, report) = parse_json_with_syntax_repair_ranked(raw, |candidate| {
            let contents = candidate["slides"][0]["contents_json"].as_str()?;
            serde_json::from_str::<Value>(contents).ok().map(|_| 0)
        })
        .expect("schema-ranked repair");
        assert_eq!(
            value["slides"][0]["contents_json"],
            r#"{"title":{"body":"A"}}"#
        );
        assert!(report.summary().contains("insert_missing_string_quote"));
    }

    #[test]
    fn preserves_decoded_business_strings_and_is_idempotent() {
        let raw = "{\"正文\":\"标点 { } [ ] : , 和引号 \\\"保持不变\\\"\" \"说明\":\"第二段\"}";
        let (value, first_report) = repaired(raw);
        assert_eq!(value["正文"], "标点 { } [ ] : , 和引号 \"保持不变\"");
        assert_eq!(value["说明"], "第二段");
        assert_eq!(first_report.count(), 1);
        let canonical = serde_json::to_string(&value).unwrap();
        let (again, second_report) = repaired(&canonical);
        assert_eq!(again, value);
        assert_eq!(second_report.count(), 0);
    }

    #[test]
    fn rejects_prose_wrappers_and_non_json_language_fences() {
        assert!(parse_json_with_syntax_repair("text {\"a\":1}").is_err());
        assert!(parse_json_with_syntax_repair("```javascript\n{\"a\":1}\n```").is_err());
    }

    #[test]
    fn repairs_each_missing_structural_token_in_a_nested_document() {
        let original = r#"{"root":{"items":[1,2,{"label":"保持内容"}],"active":true}}"#;
        let expected = serde_json::from_str::<Value>(original).unwrap();
        let mut in_string = false;
        let mut escaped = false;
        let structural_offsets = original
            .char_indices()
            .filter_map(|(offset, character)| {
                if in_string {
                    if escaped {
                        escaped = false;
                    } else if character == '\\' {
                        escaped = true;
                    } else if character == '"' {
                        in_string = false;
                    }
                    return None;
                }
                if character == '"' {
                    in_string = true;
                    return None;
                }
                matches!(character, '{' | '}' | '[' | ']' | ',' | ':').then_some(offset)
            })
            .collect::<Vec<_>>();

        for offset in structural_offsets {
            let mut damaged = original.to_string();
            damaged.remove(offset);
            if serde_json::from_str::<Value>(&damaged).is_ok() {
                continue;
            }
            let (value, report) = parse_json_with_syntax_repair_ranked(&damaged, |candidate| {
                (candidate == &expected).then_some(0)
            })
            .unwrap_or_else(|error| panic!("offset {offset}, {damaged}: {error}"));
            assert_eq!(value, expected, "offset {offset}, {damaged}");
            assert!(report.count() > 0);
        }
    }

    #[test]
    fn repairs_missing_opening_and_closing_string_quotes() {
        for damaged in [
            r#"{title":"Hello"}"#,
            r#"{"title: "Hello"}"#,
            r#"{"title":"Hello}"#,
        ] {
            let (value, report) = repaired(damaged);
            assert_eq!(value, json!({"title": "Hello"}), "{damaged}");
            assert!(report.count() > 0);
        }
    }

    #[test]
    fn serde_error_offsets_are_normalized_to_utf8_boundaries() {
        let raw = r#"{"title":"中文句号。" "detail":"missing comma"}"#;
        let error = serde_json::from_str::<Value>(raw).expect_err("damaged JSON");
        let offset = error_byte_offset(raw, &error);

        assert!(raw.is_char_boundary(offset));
        let _ = &raw[..offset];
        let _ = &raw[offset..];
    }

    #[test]
    fn malformed_json_near_multibyte_text_never_panics() {
        let cases = [
            r#"{"title":"中文句号。" "detail":"missing comma"}"#,
            r#"{"title":"中文句号。","detail":"missing quote}"#,
            r#"{"slides":[{"title":"中文句号。"} 天的说明]}"#,
            r#"{"步骤":[{"标题":"第一步","说明":"完成。"} {"标题":"第二步"}]}"#,
        ];

        for raw in cases {
            let result = std::panic::catch_unwind(|| parse_json_with_syntax_repair(raw));
            assert!(result.is_ok(), "repair panicked for {raw}");
        }
    }

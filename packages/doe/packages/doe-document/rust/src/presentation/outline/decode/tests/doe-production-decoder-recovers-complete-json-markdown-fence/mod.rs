use super::*;
#[test]
    fn doe_production_decoder_recovers_complete_json_markdown_fence() {
        let raw = r#"```json
{
  "operation": "create",
  "expected_revision": null,
  "outline": {
    "title": "完整融资路演",
    "page_count": 2,
    "body": [
      {"index": 1, "page": 1, "contents": ["封面", "保持正文不变"]},
      {"index": 2, "page": 2, "contents": ["融资用途", "Mock 数据"]}
    ]
  }
}
```"#;

        let decoded = decode_doe_traditional_outline_without_schema_validation(raw)
            .expect("complete JSON fence must be normalized");

        assert_eq!(decoded.outline.title, "完整融资路演");
        assert_eq!(decoded.outline.body.len(), 2);
        assert_eq!(decoded.outline.body[0].contents[1], "保持正文不变");
        assert!(decoded.syntax_repair_count > 0);
        assert!(decoded
            .syntax_repair_summary
            .contains("unwrap_markdown_fence"));
    }

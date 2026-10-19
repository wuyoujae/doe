use super::*;
#[test]
    fn doe_production_decoder_recovers_completed_body_with_missing_terminal_closers() {
        // Production incident shape: every page and content string is complete,
        // but the model closed the last page and outline before closing `body`,
        // then omitted the root closer.
        let raw = r#"{"operation":"create","expected_revision":null,"outline":{"title":"完整八页大纲","page_count":2,"body":[{"index":1,"page":1,"contents":["市场机会","示例/Mock 数据"]},{"index":2,"page":2,"contents":["融资用途","保持最后一条正文"]}}"#;

        let decoded = decode_doe_traditional_outline_without_schema_validation(raw)
            .expect("uniquely determined terminal delimiters must be restored");

        assert_eq!(decoded.outline.body.len(), 2);
        assert_eq!(decoded.outline.body[1].contents[1], "保持最后一条正文");
        assert!(decoded.syntax_repair_count >= 2);
        assert!(decoded
            .syntax_repair_summary
            .contains("insert_missing_delimiter"));
    }

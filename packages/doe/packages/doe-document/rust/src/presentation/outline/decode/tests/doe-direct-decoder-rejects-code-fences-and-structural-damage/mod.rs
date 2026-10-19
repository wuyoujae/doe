use super::*;
#[test]
    fn doe_direct_decoder_rejects_code_fences_and_structural_damage() {
        let fenced = r#"```json
{"operation":"create","expected_revision":null,"outline":{"title":"A","page_count":1,"body":[{"contents":["A"]}]}}
```"#;

        let error =
            decode_doe_traditional_outline(fenced).expect_err("code fences must not be repaired");
        assert!(error.starts_with(INVALID_JSON_ERROR));
        let error = decode_doe_traditional_outline(
            r#"{"operation":"create","expected_revision":null,"outline":{"title":"A","page_count":1,"body":[{"contents":["A"]}]"#,
        )
        .expect_err("missing closers must not be repaired");
        assert!(error.starts_with(INVALID_JSON_ERROR));
    }

// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::strict_json_rejects_duplicate_keys_syntax_and_depth_without_echo
use super::*;


#[test]
pub(super) fn strict_json_rejects_duplicate_keys_syntax_and_depth_without_echo() {
    for s in [
        r#"{"secret":"do-not-echo","secret":1}"#,
        "{\"a\":1,}",
        "{} {}",
        "{\"a\":NaN}",
    ] {
        let error = parse(s.as_bytes()).unwrap_err();
        assert_eq!(error.error, "invalid_json");
        assert!(!serde_json::to_string(&error)
            .unwrap()
            .contains("do-not-echo"));
        assert!(error.line.is_some());
    }
    let deep = format!("{}0{}", "[".repeat(18), "]".repeat(18));
    assert!(parse(deep.as_bytes()).is_err());
    assert!(parse(&vec![b' '; MAX_REQUEST_BYTES + 1]).is_err());
}

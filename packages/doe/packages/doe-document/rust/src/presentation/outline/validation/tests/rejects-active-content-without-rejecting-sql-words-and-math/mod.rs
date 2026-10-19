// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::rejects_active_content_without_rejecting_sql_words_and_math
use super::*;


#[test]
pub(super) fn rejects_active_content_without_rejecting_sql_words_and_math() {
    for text in [
        "<script>alert(1)</script>",
        "<svg/onload=alert(1)>",
        "javascript:alert(1)",
        "yrkie-asset-data://private",
        "file:///etc/passwd",
        "data:text/html;base64,PHNjcmlwdD4=",
        "data:;base64,AAAA",
        "a\u{0}b",
        "a\u{202e}b",
        " x ",
    ] {
        let mut v = sample();
        v["body"][0]["contents"] = json!([text]);
        assert!(errors(&v).finish().is_err(), "{text:?}");
    }
}

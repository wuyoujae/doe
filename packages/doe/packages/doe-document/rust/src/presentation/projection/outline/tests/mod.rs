
    use super::*;
    use serde_json::json;
    #[test]
    fn projects_only_content_and_scrubs_references() {
        let v = json!({"session_id":"internal-session","slides":[{"page_number":1,"contents":{"secret_name":{"body":{"type":"metric","label":"Revenue","value":42,"projectId":"internal-session","url":"https://private/path"},"describe":"See internal-session and yrkie-asset-data://secret"}}}]});
        let md = render("Demo", &v, &["internal-session"]).unwrap();
        assert!(md.contains("Revenue") && md.contains("42"));
        for secret in [
            "internal-session",
            "secret_name",
            "https://",
            "yrkie-asset",
            "projectId",
            "page_number",
        ] {
            assert!(!md.contains(secret), "{secret}");
        }
    }
    #[test]
    fn reads_legacy_outline_and_escapes_html() {
        let md = render(
            "Demo",
            &json!({"body":[{"contents":["<script>bad</script>","Growth"]}]}),
            &[],
        )
        .unwrap();
        assert!(md.contains("Growth"));
        assert!(!md.contains("<script>"));
        assert!(render("Demo", &json!({"arbitrary":{"secret":1}}), &[]).is_err());
    }

// Origin: app/backend/core/src/plugin_slide_markdown/tests.rs::preserves_page_order_groups_and_does_not_serialize_private_fields
use super::*;


#[test]
pub(super) fn preserves_page_order_groups_and_does_not_serialize_private_fields() {
    let out = output(vec![
        json!({"id":"secret-group","type":"layout-group","layout":{"secret":"private-style"},"children":[
            node("heading",json!({"text":"第一节"})),
            node("text",json!({"text":"正文 <script> private-node private-slide secret-group https://example.invalid/secret","private":"raw-secret"})),
            node("future-component",json!({"text":"private-unknown","raw":"raw-secret"})),
            node("text",json!({"text":"第二节"}))
        ]}),
    ]);
    assert!(out.contains("第 2 页 / 共 12 页"));
    assert!(out.find("第一节") < out.find("第二节"));
    assert!(out.contains("&lt;script&gt;"));
    assert!(out.contains("暂不支持"));
    for secret in [
        "private-node",
        "private-slide",
        "secret-group",
        "raw-secret",
        "private-unknown",
        "https://",
        "private-style",
        "<script>",
    ] {
        assert!(!out.contains(secret), "{secret}");
    }
}

// Origin: app/backend/core/src/plugin_slide_markdown/tests.rs::malformed_and_oversized_pages_fail_explicitly
use super::*;


#[test]
pub(super) fn malformed_and_oversized_pages_fail_explicitly() {
    for bad in [
        json!({}),
        page(vec![node("text", json!({}))]),
        page(vec![node(
            "table",
            json!({"content":{"columns":[{"header":"A"}],"rows":[{"cells":[]} ]}}),
        )]),
        page(vec![node(
            "line-chart",
            json!({"content":{"categories":["A"],"series":[{"name":"B","data":[]}]}}),
        )]),
    ] {
        assert_eq!(render("title", &bad, 1, 1, &[]), Err(UNAVAILABLE.into()));
    }
    assert_eq!(
        render(
            "title",
            &page(vec![node("text", json!({"text":"文".repeat(40001)}))]),
            1,
            1,
            &[]
        ),
        Err(TOO_LARGE.into())
    );
    let mut deep = node("text", json!({"text":"leaf"}));
    for _ in 0..18 {
        deep = json!({"type":"layout-group","children":[deep]});
    }
    assert_eq!(
        render("title", &page(vec![deep]), 1, 1, &[]),
        Err(TOO_LARGE.into())
    );
    assert_eq!(
        render(
            "title",
            &page(vec![node("text", json!({"text":"x"})); 2049]),
            1,
            1,
            &[]
        ),
        Err(TOO_LARGE.into())
    );
}

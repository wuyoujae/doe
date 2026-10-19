// Origin: app/backend/core/src/doe_slide_edit/tests.rs::snapshot_fence_ignores_other_pages_revision_and_tracks_theme_and_content
use super::*;


#[test]
pub(super) fn snapshot_fence_ignores_other_pages_revision_and_tracks_theme_and_content() {
    let a = Snapshot {
        authoring_markdown: None,
        slide_id: "s1".into(),
        page_number: 1,
        slide_count: 3,
        revision: 5,
        slide: page(),
        shared: json!({"title":"Deck","pageNumber":{"enabled":true}}),
    };
    let mut b = a.clone();
    b.revision = 9;
    b.page_number = 2;
    b.slide_count = 4;
    assert_eq!(a.fingerprint(), b.fingerprint());
    b.shared["pageNumber"]["enabled"] = json!(false);
    assert_ne!(a.fingerprint(), b.fingerprint());
    b = a.clone();
    b.slide["blocks"][0]["children"][0]["props"]["text"] = json!("Manual edit");
    assert_ne!(a.fingerprint(), b.fingerprint());
}

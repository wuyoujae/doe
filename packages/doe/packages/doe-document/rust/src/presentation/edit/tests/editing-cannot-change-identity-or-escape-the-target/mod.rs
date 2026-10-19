// Origin: app/backend/core/src/doe_slide_edit/tests.rs::editing_cannot_change_identity_or_escape_the_target
use super::*;


#[test]
pub(super) fn editing_cannot_change_identity_or_escape_the_target() {
    for path in ["/id", "/children/0/id", "/props/../../id", ""] {
        let input = serde_json::from_value(
            json!({"operations":[{"op":"set","node_id":"n1","path":path,"value":"wrong"}]}),
        )
        .unwrap();
        assert!(apply(&page(), &input).is_err());
    }
    let mut replacement = page();
    replacement["id"] = json!("s2");
    assert!(apply(
        &page(),
        &Edit {
            operations: vec![],
            slide: Some(replacement)
        }
    )
    .is_err());
}

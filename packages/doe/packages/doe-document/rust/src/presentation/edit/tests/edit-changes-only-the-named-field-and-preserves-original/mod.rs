// Origin: app/backend/core/src/doe_slide_edit/tests.rs::edit_changes_only_the_named_field_and_preserves_original
use super::*;


#[test]
pub(super) fn edit_changes_only_the_named_field_and_preserves_original() {
    let source = page();
    let input: Edit = serde_json::from_value(
        json!({"operations":[{"op":"set","node_id":"n1","path":"/props/text","value":"Updated"}]}),
    )
    .unwrap();
    let candidate = apply(&source, &input).unwrap();
    let mut expected = source.clone();
    expected["blocks"][0]["children"][0]["props"]["text"] = json!("Updated");
    assert_eq!(candidate, expected);
    assert_eq!(source, page());
}

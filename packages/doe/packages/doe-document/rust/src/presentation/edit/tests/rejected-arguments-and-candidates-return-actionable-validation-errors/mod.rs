// Origin: app/backend/core/src/doe_slide_edit/tests.rs::rejected_arguments_and_candidates_return_actionable_validation_errors
use super::*;


#[test]
pub(super) fn rejected_arguments_and_candidates_return_actionable_validation_errors() {
    let before = Snapshot {
        authoring_markdown: None,
        slide_id: "s1".into(), page_number: 1, slide_count: 1, revision: 1,
        slide: page(), shared: json!({"title":"Edit", "pageNumber":{"enabled":true,"format":"number"}}),
    };
    for args in [
        json!({"operations":["{\"op\":\"remove_node\",\"node_id\":\"n1\"}"]}),
        json!({"operations":[{"op":"set","node_id":"n1","path":"/id","value":"wrong"}]}),
        json!({"operations":[{"op":"set","node_id":"n1","path":"/props/text","value":42}]}),
    ] {
        let failure = super::super::validation::prepare_candidate(&before, args).unwrap_err();
        assert!(!failure.issues.is_empty());
        assert!(!failure.issues[0].path.is_empty());
        assert!(!failure.issues[0].hint.is_empty());
        assert_eq!(before.slide, page());
    }
    let corrected = super::super::validation::prepare_candidate(&before, json!({"operations":[
        {"op":"set","node_id":"n1","path":"/props/text","value":"Corrected"}
    ]})).unwrap();
    assert_eq!(corrected["blocks"][0]["children"][0]["props"]["text"], "Corrected");

    let mut legacy = before.clone();
    legacy.slide["blocks"][0]["children"][0]["props"]["textRole"] = json!("describe");
    let updated = super::super::validation::prepare_candidate(&legacy, json!({"operations":[
        {"op":"set","node_id":"n1","path":"/props/text","value":"Updated body"}
    ]})).unwrap();
    assert_eq!(updated["blocks"][0]["children"][0]["props"], json!({"text":"Updated body"}));
    assert_eq!(updated["blocks"][0]["children"][1], legacy.slide["blocks"][0]["children"][1]);
    assert_eq!(legacy.slide["blocks"][0]["children"][0]["props"]["textRole"], "describe");
}

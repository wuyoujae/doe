// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::published_examples_pass_the_actual_server_gate_and_match_capacity_contract
use super::*;


#[test]
pub(super) fn published_examples_pass_the_actual_server_gate_and_match_capacity_contract() {
    let schema: Value =
        serde_json::from_str(include_str!("../../../../../../../src/document/presentation/schema/authoring/schemas/doe-outline-v1.schema.json")).unwrap();
    assert_eq!(
        schema["properties"]["body"]["maxItems"],
        crate::presentation::outline::limits::MAX_OUTLINE_SLIDES
    );
    assert_eq!(schema["x-maxUtf8Bytes"], MAX_DOCUMENT_BYTES);
    let description = schema["properties"]["body"]["items"]["properties"]["contents"]["items"]["description"]
        .as_str().unwrap();
    let marker = regex::Regex::new(r"GENRATEIMG\[[^\]]+\]\([^)]*\)").unwrap()
        .find(description).expect("complete image-plan example").as_str();
    let mut document = sample();
    document["body"][0]["contents"] = json!([marker]);
    errors(&document).finish().expect("machine schema's image example passes the server gate");
    assert_eq!(crate::presentation::outline::image_placeholder::scan(&document).unwrap().len(), 1);
    let examples: Vec<Value> =
        serde_json::from_str(include_str!("../../../../../../../src/document/presentation/schema/authoring/schemas/doe-outline-v1.examples.json")).unwrap();
    for value in examples {
        errors(&value).finish().unwrap();
    }
}

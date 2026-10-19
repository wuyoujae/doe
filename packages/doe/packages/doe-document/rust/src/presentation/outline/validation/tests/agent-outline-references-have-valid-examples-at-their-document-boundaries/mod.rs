// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::agent_outline_references_have_valid_examples_at_their_document_boundaries
use super::*;


#[test]
pub(super) fn agent_outline_references_have_valid_examples_at_their_document_boundaries() {
    let references = [
        ("platform", include_str!("../../../../../../../src/document/presentation/schema/authoring/default-prompts/outline.schema.md")),
        ("skills", include_str!("../../../../../../../src/document/presentation/schema/authoring/default-prompts/skills-outline.md")),
    ];
    let mut json_examples = 0;
    let mut markdown_examples = 0;
    let mut outlines = 0;
    for (name, reference) in references {
        assert!(reference.is_ascii(), "{name} reference must be English");
        roxmltree::Document::parse(&format!("<reference>{reference}</reference>"))
            .unwrap_or_else(|error| panic!("{name} tag structure: {error}"));
        for section in reference.split("```markdown").skip(1) {
            let raw = section.split("```").next().expect("closed Markdown example").trim();
            let compiled = crate::presentation::outline::markdown::compile(raw).expect("platform Markdown example");
            errors(&compiled.outline).finish().expect("compiled example fits storage contract");
            assert_eq!(crate::presentation::outline::image_placeholder::scan(&compiled.outline).unwrap().len(), 2);
            markdown_examples += 1;
            outlines += 1;
        }
        for section in reference.split("```json").skip(1) {
            let raw = section.split("```").next().expect("closed JSON example").trim();
            let value = parse(raw.as_bytes()).expect("strict JSON example");
            json_examples += 1;
            let document = if name == "platform" {
                crate::presentation::outline::decode::decode_doe_traditional_outline(raw)
                    .expect("platform envelope");
                &value["outline"]
            } else if value.get("outline").is_some() {
                assert!(value.get("operation").is_none());
                let mut failure = Failure::from("validation_failed");
                object(&value, "", &["projectRef", "requestId", "expectedOutline", "outline"], &mut failure);
                request_id(&value["requestId"], &mut failure);
                failure.finish().expect("external save wrapper");
                &value["outline"]
            } else if value.get("body").is_some() {
                &value
            } else {
                // Preparation/confirmation examples are checked against actual MCP
                // argument definitions separately; they contain no Outline document.
                continue;
            };
            errors(document).finish().unwrap_or_else(|error| {
                panic!("{name} example failed external document validation: {error:?}")
            });
            crate::presentation::outline::image_placeholder::scan(document).expect("image plans parse");
            outlines += 1;
        }
        for marker in reference.split('`').filter(|part| part.starts_with("GENRATEIMG[type=")) {
            let document = json!({"title":"Marker example","page_count":1,"body":[{
                "index":1,"page":1,"contents":[marker]
            }]});
            errors(&document).finish().expect("inline marker example");
            assert_eq!(crate::presentation::outline::image_placeholder::scan(&document).unwrap().len(), 1);
        }
        for section in reference.split("```text").skip(1) {
            for marker in section.split("```").next().unwrap().lines().filter(|line| !line.is_empty()) {
                let document = json!({"title":"Marker example","page_count":1,"body":[{
                    "index":1,"page":1,"contents":[marker]
                }]});
                errors(&document).finish().expect("complete marker example");
                assert_eq!(crate::presentation::outline::image_placeholder::scan(&document).unwrap().len(), 1);
            }
        }
    }
    assert_eq!(json_examples, 5);
    assert_eq!(markdown_examples, 1);
    assert_eq!(outlines, 4);
}

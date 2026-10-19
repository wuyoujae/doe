// Origin: app/backend/core/src/slide_agent_output_contract/validation/tests.rs::all_authoring_examples_pass_without_mutation
use super::*;


#[test]
pub(super) fn all_authoring_examples_pass_without_mutation() {
    for case in cases()["cases"].as_array().unwrap() {
        let slide = &case["root"]["deck"]["slides"][0];
        let original = slide.clone();
        validate_slide(slide).unwrap_or_else(|e| panic!("{}: {e:?}", case["name"]));
        assert_eq!(slide, &original);
    }
    let mut example_count = 0;
    for section in include_str!("../../../../../../../../src/document/presentation/schema/authoring/default-prompts/slide.schema.md")
        .split("```doe")
        .skip(1)
    {
        let raw = section.split("```").next().unwrap().trim();
        let source = if raw.starts_with("# slide") { raw.to_owned() } else { format!("# slide\n{raw}") };
        let compiled = crate::presentation::schema::markdown::compile(&source, &[]).unwrap();
        assert!(compiled.diagnostics.is_empty());
        let slides = compiled.value["deck"]["slides"].as_array().unwrap();
        for slide in slides {
            let original = slide.clone();
            validate_slide(slide).unwrap();
            assert_eq!(slide, &original);
            example_count += 1;
        }
    }
    assert!(example_count > 0, "the authoring reference must retain executable examples");
}

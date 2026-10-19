// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::local_outline_design_briefs_pass_the_external_gate_and_real_image_parser
use super::*;


#[test]
pub(super) fn local_outline_design_briefs_pass_the_external_gate_and_real_image_parser() {
    let reference = include_str!("../../../../../../../src/document/presentation/schema/authoring/default-prompts/skills-outline.design.md");
    let markers = reference
        .split('`')
        .filter(|part| part.starts_with("GENRATEIMG["))
        .collect::<Vec<_>>();
    assert_eq!(markers.len(), 3);
    let body = markers
        .iter()
        .enumerate()
        .map(|(index, marker)| json!({
            "index":index + 1,"page":index + 1,"contents":["Image brief",marker]
        }))
        .collect::<Vec<_>>();
    let outline = json!({"title":"Local image briefs","page_count":body.len(),"body":body});
    let parsed = parse(outline.to_string().as_bytes()).expect("strict serialized Outline JSON");
    errors(&parsed).finish().expect("actual external Outline validation");
    let plans = crate::presentation::outline::image_placeholder::scan(&parsed).expect("actual image marker parser");
    assert_eq!(plans.len(), 3);
    for (plan, (image_type, ratio)) in plans.iter().zip([
        ("content", "4:3"), ("decorative", "9:16"), ("decorative", "16:9"),
    ]) {
        assert_eq!(plan.image_type.as_str(), image_type);
        assert_eq!(plan.ratio, ratio);
        assert!(!plan.prompt.is_empty());
    }
    assert!(reference.contains(&format!(
        "no more than {} generated-image markers",
        doe_core::asset::generated::MAX_OUTLINE_GENERATED_IMAGES
    )));
}

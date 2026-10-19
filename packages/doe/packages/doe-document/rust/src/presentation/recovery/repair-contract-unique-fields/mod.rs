// Origin: app/backend/core/src/slide_recovery/mod.rs::repair_contract_unique_fields
use super::*;


pub(super) fn repair_contract_unique_fields(
    candidate: &mut Value,
    expectations: SlideDeckExpectations,
    frozen_indices: &BTreeSet<usize>,
    edits: &mut Vec<SlideRepairEdit>,
) -> Result<(), String> {
    let schema_format = slide_agent_output_contract::response_format(expectations);
    let root_schema = &schema_format["json_schema"]["schema"];
    repair_root_controls(candidate, edits);

    let slide_schema = &root_schema["properties"]["deck"]["properties"]["slides"]["items"];
    let Some(slides) = candidate
        .get_mut("deck")
        .and_then(|deck| deck.get_mut("slides"))
        .and_then(Value::as_array_mut)
    else {
        return Ok(());
    };
    for (page_index, slide) in slides.iter_mut().enumerate() {
        if frozen_indices.contains(&page_index) {
            continue;
        }
        repair_against_schema(
            slide,
            slide_schema,
            &format!("root.deck.slides[{page_index}]"),
            Some(page_index),
            edits,
        );
        repair_slide_semantics(slide, page_index, edits);
    }
    Ok(())
}

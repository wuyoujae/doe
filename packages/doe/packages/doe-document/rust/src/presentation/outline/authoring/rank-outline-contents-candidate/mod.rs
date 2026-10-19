// Origin: app/backend/core/src/outline_agent_output_contract.rs::rank_outline_contents_candidate
use super::*;


pub(super) fn rank_outline_contents_candidate(value: &Value) -> Option<usize> {
    let mut contents = value.as_object().cloned().map(Value::Object)?;
    normalize_missing_generated_image_types(&mut contents);
    normalize_generated_image_types(&mut contents);
    normalize_blank_text_block_paragraphs(&mut contents);
    let outline = serde_json::from_value::<OutlineInput>(json!({
        "slides": [{"page_number": 1, "contents": contents}]
    }))
    .ok()?;
    OutlineContractGraph::current()
        .validate_canonical_outline(outline)
        .ok()?;
    Some(0)
}

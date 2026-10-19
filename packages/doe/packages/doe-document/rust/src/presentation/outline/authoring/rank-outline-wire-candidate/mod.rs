// Origin: app/backend/core/src/outline_agent_output_contract.rs::rank_outline_wire_candidate
use super::*;


pub(super) fn rank_outline_wire_candidate(value: &Value) -> Option<usize> {
    let envelope = serde_json::from_value::<OutlineEnvelope>(value.clone()).ok()?;
    match envelope.operation {
        OutlineOperation::Create if envelope.expected_revision.is_some() => return None,
        OutlineOperation::Replace | OutlineOperation::Edit
            if envelope
                .expected_revision
                .is_none_or(|revision| revision <= 0) =>
        {
            return None;
        }
        _ => {}
    }
    let outline = envelope.outline.as_object()?;
    let slides = outline.get("slides")?.as_array()?;
    let mut nested_repair_count = 0usize;
    let mut canonical_slides = Vec::with_capacity(slides.len());
    for slide in slides {
        let slide = slide.as_object()?;
        let page_number = slide.get("page_number")?.as_i64()?;
        let mut contents = match (slide.get("contents"), slide.get("contents_json")) {
            (Some(Value::Object(contents)), None) => Value::Object(contents.clone()),
            (None, Some(Value::String(contents_json))) => {
                let (contents, report, _) =
                    parse_outline_contents_with_report(contents_json).ok()?;
                if !contents.is_object() {
                    return None;
                }
                nested_repair_count = nested_repair_count.checked_add(report.count())?;
                contents
            }
            _ => return None,
        };
        normalize_missing_generated_image_types(&mut contents);
        normalize_generated_image_types(&mut contents);
        normalize_blank_text_block_paragraphs(&mut contents);
        canonical_slides.push(json!({
            "page_number": page_number,
            "contents": contents,
        }));
    }
    let outline =
        serde_json::from_value::<OutlineInput>(json!({"slides": canonical_slides})).ok()?;
    OutlineContractGraph::current()
        .validate_canonical_outline(outline)
        .ok()?;
    Some(nested_repair_count)
}

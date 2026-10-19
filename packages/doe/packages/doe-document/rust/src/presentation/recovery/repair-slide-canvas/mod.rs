// Origin: app/backend/core/src/slide_recovery/mod.rs::repair_slide_canvas
use super::*;


pub(super) fn repair_slide_canvas(
    slide: &mut Map<String, Value>,
    page_index: usize,
    edits: &mut Vec<SlideRepairEdit>,
) {
    let path = format!("root.deck.slides[{page_index}].size");
    let canonical = json!({"width": 960, "height": 540, "unit": "pt"});
    let repairable = match slide.get("size") {
        None => true,
        Some(Value::Object(size)) => size
            .keys()
            .all(|key| matches!(key.as_str(), "width" | "height" | "unit")),
        Some(_) => false,
    };
    if repairable && slide.get("size") != Some(&canonical) {
        let before = slide.get("size").cloned().unwrap_or(Value::Null);
        slide.insert("size".to_string(), canonical.clone());
        record_edit(
            edits,
            "contract.fixed_canvas",
            &path,
            "replace_with_fixed_canvas",
            Some(page_index),
            &before,
            &canonical,
            "schema-v4 canvas is fixed at 960x540 pt and size carries no business content",
        );
    }
}

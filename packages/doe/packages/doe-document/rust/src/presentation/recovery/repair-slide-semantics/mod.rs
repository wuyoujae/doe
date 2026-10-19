// Origin: app/backend/core/src/slide_recovery/mod.rs::repair_slide_semantics
use super::*;


pub(super) fn repair_slide_semantics(slide: &mut Value, page_index: usize, edits: &mut Vec<SlideRepairEdit>) {
    let Some(slide) = slide.as_object_mut() else {
        return;
    };
    repair_slide_canvas(slide, page_index, edits);
    let Some(blocks) = slide.get_mut("blocks").and_then(Value::as_array_mut) else {
        return;
    };
    let mut ids = BTreeSet::new();
    collect_node_ids(blocks, &mut ids);
    for (node_index, node) in blocks.iter_mut().enumerate() {
        repair_node_semantics(
            node,
            &format!("root.deck.slides[{page_index}].blocks[{node_index}]"),
            page_index,
            &mut ids,
            edits,
        );
    }
}

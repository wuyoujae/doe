// Origin: app/backend/core/src/slide_recovery/mod.rs::repair_known_renderer_slide
use super::*;


pub(super) fn repair_known_renderer_slide(
    slide: &mut Value,
    page_index: usize,
    edits: &mut Vec<SlideRepairEdit>,
) {
    let Some(slide_object) = slide.as_object_mut() else {
        return;
    };
    if let Some(layout) = slide_object
        .get_mut("layout")
        .and_then(Value::as_object_mut)
    {
        for key in ["allowsBleed", "bleedRegion", "lockSafeArea"] {
            if let Some(before) = layout.remove(key) {
                record_edit(
                    edits,
                    "renderer.ignored_slide_layout_control",
                    &format!("root.deck.slides[{page_index}].layout.{key}"),
                    "remove_renderer_ignored_control",
                    Some(page_index),
                    &before,
                    &Value::Null,
                    "the production renderer ignores this legacy layout control and it carries no business content",
                );
            }
        }
    }
    let Some(blocks) = slide_object.get_mut("blocks").and_then(Value::as_array_mut) else {
        return;
    };
    let mut ids = BTreeSet::new();
    collect_node_ids(blocks, &mut ids);
    repair_known_renderer_nodes(
        blocks,
        &format!("root.deck.slides[{page_index}].blocks"),
        page_index,
        &mut ids,
        edits,
    );
}

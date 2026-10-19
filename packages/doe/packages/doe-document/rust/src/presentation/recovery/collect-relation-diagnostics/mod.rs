// Origin: app/backend/core/src/slide_recovery/mod.rs::collect_relation_diagnostics
use super::*;


pub(super) fn collect_relation_diagnostics(candidate: &Value, diagnostics: &mut Vec<SlideDiagnostic>) {
    let Some(slides) = candidate_slides(candidate) else {
        return;
    };
    let mut slide_ids = HashMap::<&str, Vec<usize>>::new();
    for (page_index, slide) in slides.iter().enumerate() {
        if let Some(slide_id) = slide.get("id").and_then(Value::as_str) {
            slide_ids.entry(slide_id).or_default().push(page_index);
        }
        let mut node_ids = HashMap::<String, Vec<String>>::new();
        if let Some(blocks) = slide.get("blocks").and_then(Value::as_array) {
            for (node_index, node) in blocks.iter().enumerate() {
                collect_node_relation_diagnostics(
                    node,
                    &format!("root.deck.slides[{page_index}].blocks[{node_index}]"),
                    page_index,
                    &mut node_ids,
                    diagnostics,
                );
            }
        }
        for paths in node_ids.values().filter(|paths| paths.len() > 1) {
            for path in paths {
                push_relation_diagnostic(
                    diagnostics,
                    "node.id_duplicate",
                    &format!("{path}.id"),
                    "node id is duplicated within the page",
                    page_index,
                );
            }
        }
    }
    for indices in slide_ids.values().filter(|indices| indices.len() > 1) {
        for page_index in indices {
            push_relation_diagnostic(
                diagnostics,
                "deck.slide_id_duplicate",
                &format!("root.deck.slides[{page_index}].id"),
                "Slide id is duplicated within the Deck",
                *page_index,
            );
        }
    }
}

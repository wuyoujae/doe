// Origin: app/backend/core/src/slide_recovery/mod.rs::duplicate_slide_id_indices
use super::*;


pub(super) fn duplicate_slide_id_indices(slides: &[Value]) -> BTreeSet<usize> {
    let mut first_indices = std::collections::HashMap::<&str, usize>::new();
    let mut duplicates = BTreeSet::new();
    for (index, slide) in slides.iter().enumerate() {
        let Some(id) = slide.get("id").and_then(Value::as_str) else {
            continue;
        };
        if let Some(first_index) = first_indices.get(id) {
            duplicates.insert(*first_index);
            duplicates.insert(index);
        } else {
            first_indices.insert(id, index);
        }
    }
    duplicates
}

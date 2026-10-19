// Origin: app/backend/core/src/json_syntax_repair.rs::nearby_character_boundaries
use super::*;


pub(super) fn nearby_character_boundaries(text: &str, center: usize) -> Vec<usize> {
    let mut boundaries = text
        .char_indices()
        .map(|(offset, _)| offset)
        .collect::<Vec<_>>();
    boundaries.push(text.len());
    let center_index = boundaries.partition_point(|offset| *offset < center);
    let start = center_index.saturating_sub(NEARBY_CHARACTER_RADIUS);
    let end = (center_index + NEARBY_CHARACTER_RADIUS + 1).min(boundaries.len());
    let mut nearby = boundaries[start..end].to_vec();
    nearby.dedup();
    nearby.sort_by_key(|offset| offset.abs_diff(center));
    nearby
}

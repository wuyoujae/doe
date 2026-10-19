// Origin: app/backend/core/src/outline_recovery/compiler/structural.rs::insert_missing_closer
use super::*;


pub(super) fn insert_missing_closer(
    frames: &[Frame],
    offset: usize,
    insertions: &mut Vec<(usize, char, &'static str, usize)>,
    constraint_id: &'static str,
) {
    let frame = frames.last().expect("a missing closer requires a frame");
    insertions.push((offset, frame.closer(), constraint_id, frame.start));
}

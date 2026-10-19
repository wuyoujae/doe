// Origin: app/backend/core/src/slide_recovery/mod.rs::page_index_from_path


pub(super) fn page_index_from_path(value: &str) -> Option<usize> {
    let suffix = value.split_once("root.deck.slides[")?.1;
    suffix.split_once(']')?.0.parse().ok()
}

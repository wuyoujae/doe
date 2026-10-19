// Origin: app/backend/core/src/slide_recovery/duplicate_json.rs::leaf
use super::*;


pub(super) fn leaf(value: Value) -> DuplicateAwareJson {
    DuplicateAwareJson {
        value,
        equal_paths: Vec::new(),
        conflicting_paths: Vec::new(),
    }
}

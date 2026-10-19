// Origin: app/backend/core/src/slide_recovery/duplicate_json.rs::prefix_paths


pub(super) fn prefix_paths(prefix: &str, paths: &mut [String]) {
    for path in paths {
        path.insert_str(0, prefix);
    }
}

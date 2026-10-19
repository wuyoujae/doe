// Origin: app/backend/core/src/slide_recovery/duplicate_json.rs::escape_json_pointer_segment


pub(super) fn escape_json_pointer_segment(value: &str) -> String {
    value.replace('~', "~0").replace('/', "~1")
}

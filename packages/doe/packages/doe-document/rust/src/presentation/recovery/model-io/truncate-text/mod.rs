// Origin: app/backend/core/src/slide_recovery/model_io.rs::truncate_text


pub(super) fn truncate_text(value: &str, max_chars: usize) -> String {
    value.chars().take(max_chars).collect()
}

// Origin: app/backend/core/src/slide_recovery/grounding.rs::normalize


pub(super) fn normalize(value: &str) -> String {
    value
        .chars()
        .flat_map(char::to_lowercase)
        .filter(|value| value.is_alphanumeric())
        .collect()
}

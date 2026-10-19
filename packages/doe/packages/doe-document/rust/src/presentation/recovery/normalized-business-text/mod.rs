// Origin: app/backend/core/src/slide_recovery/mod.rs::normalized_business_text


pub(super) fn normalized_business_text(value: &str) -> String {
    value
        .chars()
        .flat_map(char::to_lowercase)
        .filter(|character| character.is_alphanumeric())
        .collect()
}

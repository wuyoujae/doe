// Origin: app/backend/core/src/slide_recovery/grounding.rs::strip_display_ordinal_prefix


pub(super) fn strip_display_ordinal_prefix(value: &str) -> &str {
    let digit_count = value
        .chars()
        .take_while(|character| character.is_ascii_digit())
        .count();
    if !(1..=2).contains(&digit_count) {
        return value;
    }
    let remainder = &value[digit_count..];
    let trimmed = remainder.trim_start();
    let Some(separator) = trimmed.chars().next() else {
        return value;
    };
    if matches!(separator, '·' | '.' | '、' | '-' | '—' | ':') {
        trimmed[separator.len_utf8()..].trim_start()
    } else {
        value
    }
}

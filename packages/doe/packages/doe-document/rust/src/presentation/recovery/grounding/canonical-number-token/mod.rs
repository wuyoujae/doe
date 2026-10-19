// Origin: app/backend/core/src/slide_recovery/grounding.rs::canonical_number_token


pub(super) fn canonical_number_token(value: &str) -> String {
    let mut value = value.replace(',', "");
    let percent = value.ends_with('%').then(|| value.pop()).is_some();
    if value.starts_with('+') {
        value.remove(0);
    }
    let sign = if value.starts_with('-') {
        value.remove(0);
        "-"
    } else {
        ""
    };
    if value.chars().filter(|character| *character == '.').count() <= 1
        && value
            .chars()
            .all(|character| character.is_ascii_digit() || character == '.')
    {
        let (integer, fraction) = value.split_once('.').unwrap_or((&value, ""));
        let integer = integer.trim_start_matches('0');
        let integer = if integer.is_empty() { "0" } else { integer };
        let fraction = fraction.trim_end_matches('0');
        value = if fraction.is_empty() {
            integer.to_string()
        } else {
            format!("{integer}.{fraction}")
        };
        if sign == "-" && value != "0" {
            value.insert(0, '-');
        }
    } else if sign == "-" {
        value.insert(0, '-');
    }
    if percent {
        value.push('%');
    }
    value
}

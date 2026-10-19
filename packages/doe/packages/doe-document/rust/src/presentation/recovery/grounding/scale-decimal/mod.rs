// Origin: app/backend/core/src/slide_recovery/grounding.rs::scale_decimal
use super::*;


pub(super) fn scale_decimal(value: &str, decimal_shift: i32) -> Option<String> {
    let value = canonical_number_token(value);
    if value.ends_with('%') || value.contains('-') && !value.starts_with('-') {
        return None;
    }
    let negative = value.starts_with('-');
    let value = value.strip_prefix('-').unwrap_or(&value);
    if !value
        .chars()
        .all(|character| character.is_ascii_digit() || character == '.')
        || value.chars().filter(|character| *character == '.').count() > 1
    {
        return None;
    }
    let (integer, fraction) = value.split_once('.').unwrap_or((value, ""));
    let mut digits = format!("{integer}{fraction}");
    if digits.is_empty() {
        return None;
    }
    let mut point = i32::try_from(integer.len())
        .ok()?
        .checked_add(decimal_shift)?;
    while point < 0 {
        digits.insert(0, '0');
        point += 1;
    }
    while usize::try_from(point).ok()? > digits.len() {
        digits.push('0');
    }
    let point = usize::try_from(point).ok()?;
    let shifted = if point == 0 {
        format!("0.{digits}")
    } else if point == digits.len() {
        digits
    } else {
        format!("{}.{}", &digits[..point], &digits[point..])
    };
    let mut shifted = canonical_number_token(&shifted);
    if negative && shifted != "0" {
        shifted.insert(0, '-');
    }
    Some(shifted)
}

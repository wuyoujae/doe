// Origin: app/backend/core/src/outline_recovery/compiler/lexical.rs::fence_opening


pub(super) fn fence_opening(line: &str) -> Option<(char, usize, &str)> {
    let trimmed = line.trim();
    let marker = trimmed.chars().next()?;
    if !matches!(marker, '`' | '~') {
        return None;
    }
    let count = trimmed
        .chars()
        .take_while(|character| *character == marker)
        .count();
    (count >= 3).then(|| (marker, count, trimmed[count..].trim()))
}

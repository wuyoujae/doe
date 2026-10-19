// Origin: app/backend/core/src/json_syntax_repair.rs::unwrap_single_markdown_json_fence


pub(super) fn unwrap_single_markdown_json_fence(raw: &str) -> Option<&str> {
    let trimmed = raw.trim();
    let opening_line_end = trimmed.find('\n')?;
    let opening_line = trimmed[..opening_line_end].trim();
    let marker = opening_line.chars().next()?;
    if !matches!(marker, '`' | '~') {
        return None;
    }
    let opening_fence_len = opening_line.chars().take_while(|ch| *ch == marker).count();
    if opening_fence_len < 3 {
        return None;
    }
    let language = opening_line[opening_fence_len..].trim();
    if !language.is_empty() && !language.eq_ignore_ascii_case("json") {
        return None;
    }

    let body_and_closing = &trimmed[opening_line_end + 1..];
    let closing_line_start = body_and_closing.rfind('\n')?;
    let closing_line = body_and_closing[closing_line_start + 1..].trim();
    if closing_line.chars().count() != opening_fence_len
        || !closing_line.chars().all(|ch| ch == marker)
    {
        return None;
    }
    let body = body_and_closing[..closing_line_start].trim();
    (!body.is_empty()).then_some(body)
}

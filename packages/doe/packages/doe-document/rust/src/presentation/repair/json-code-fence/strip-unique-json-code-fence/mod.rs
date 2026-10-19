// Origin: app/backend/core/src/slide_auto_repair_v2/json_code_fence.rs::strip_unique_json_code_fence
use super::*;


pub(in super::super) fn strip_unique_json_code_fence(raw: &str) -> Result<JsonCodeFence<'_>, String> {
    let trimmed = raw.trim();
    if !trimmed.starts_with("```") {
        return Ok(JsonCodeFence::NotPresent);
    }

    let opening_end = trimmed.find('\n').ok_or_else(invalid_json_fence)?;
    let opening = trimmed[..opening_end]
        .strip_suffix('\r')
        .unwrap_or(&trimmed[..opening_end]);
    if !opening.eq_ignore_ascii_case("```json") {
        return Err(invalid_json_fence());
    }

    let body_and_closing = &trimmed[opening_end + 1..];
    let closing_start = body_and_closing
        .rfind('\n')
        .ok_or_else(invalid_json_fence)?;
    let closing = body_and_closing[closing_start + 1..]
        .strip_suffix('\r')
        .unwrap_or(&body_and_closing[closing_start + 1..]);
    if closing != "```" {
        return Err(invalid_json_fence());
    }

    let mut body = &body_and_closing[..closing_start];
    if let Some(without_cr) = body.strip_suffix('\r') {
        body = without_cr;
    }
    if body.trim().is_empty() || contains_nested_fence(body) {
        return Err(invalid_json_fence());
    }
    Ok(JsonCodeFence::Removed(body))
}

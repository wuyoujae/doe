// Origin: app/backend/core/src/outline_recovery/compiler/lexical.rs::fenced_json_spans
use super::*;


pub(super) fn fenced_json_spans(source: &str) -> Result<Vec<SourceSpan>, String> {
    let lines = source_lines(source);
    let mut spans = Vec::new();
    let mut index = 0usize;
    while index < lines.len() {
        let Some((marker, count, language)) = fence_opening(lines[index].text) else {
            index += 1;
            continue;
        };
        if !language.is_empty() && !language.eq_ignore_ascii_case("json") {
            return Err("JSON framing contains a non-JSON markdown fence".to_string());
        }
        let closing = marker.to_string().repeat(count);
        let Some(closing_index) =
            (index + 1..lines.len()).find(|candidate| lines[*candidate].text.trim() == closing)
        else {
            return Err("JSON framing contains an unclosed or mixed markdown fence".to_string());
        };
        let inner = trimmed_span(source, lines[index].end, lines[closing_index].start);
        if inner.start == inner.end
            || !matches!(source.as_bytes().get(inner.start), Some(b'{') | Some(b'['))
        {
            return Err("JSON markdown fence did not contain one root document".to_string());
        }
        spans.push(inner);
        index = closing_index + 1;
    }
    Ok(spans)
}

// Origin: app/backend/core/src/outline_recovery/compiler/lexical.rs::frame_single_json_document
use super::*;


pub(in super::super) fn frame_single_json_document(raw: &str) -> Result<FramedJson, String> {
    let mut outer = trimmed_span(raw, 0, raw.len());
    if raw[outer.start..outer.end].starts_with('\u{feff}') {
        outer.start += '\u{feff}'.len_utf8();
        outer = trimmed_span(raw, outer.start, outer.end);
    }
    if outer.start == outer.end {
        return Err("JSON framing did not contain a document".to_string());
    }

    let bounded = &raw[outer.start..outer.end];
    let fenced = fenced_json_spans(bounded)?
        .into_iter()
        .map(|span| SourceSpan {
            start: outer.start + span.start,
            end: outer.start + span.end,
        })
        .collect::<Vec<_>>();
    if fenced.len() > 1 {
        return Err("JSON framing contains multiple markdown documents".to_string());
    }

    let strict_roots = strict_json_root_spans(bounded)
        .into_iter()
        .map(|span| SourceSpan {
            start: outer.start + span.start,
            end: outer.start + span.end,
        })
        .collect::<Vec<_>>();
    let document = if let Some(fence) = fenced.first().copied() {
        if strict_roots
            .iter()
            .any(|span| span.start < fence.start || span.end > fence.end)
        {
            return Err(
                "JSON framing contains a second root document outside its fence".to_string(),
            );
        }
        fence
    } else if matches!(bounded.as_bytes().first(), Some(b'{') | Some(b'[')) {
        // A root that already starts at the framing boundary owns the whole response. Preserve
        // trailing bytes for strict parsing instead of silently treating them as a wrapper; this
        // prevents business text swallowed into a legacy `contents_json` string from disappearing.
        match strict_roots
            .iter()
            .find(|span| span.start == outer.start)
            .copied()
        {
            Some(root)
                if strict_roots
                    .iter()
                    .all(|span| span.start >= root.start && span.end <= root.end)
                    && root.end == outer.end =>
            {
                root
            }
            Some(root)
                if strict_roots
                    .iter()
                    .any(|span| span.start < root.start || span.end > root.end) =>
            {
                return Err("JSON framing contains multiple root documents".to_string())
            }
            _ => outer,
        }
    } else {
        match strict_roots.as_slice() {
            [only] => *only,
            [] => return Err("JSON framing contains prose or an unsupported wrapper".to_string()),
            _ => return Err("JSON framing contains multiple root documents".to_string()),
        }
    };

    let mut findings = Vec::new();
    let mut edits = Vec::new();
    let mut syntax_report = JsonSyntaxRepairReport::default();
    record_wrapper_removal(
        raw,
        SourceSpan {
            start: 0,
            end: document.start,
        },
        &mut findings,
        &mut edits,
    );
    record_wrapper_removal(
        raw,
        SourceSpan {
            start: document.end,
            end: raw.len(),
        },
        &mut findings,
        &mut edits,
    );
    if !edits.is_empty() {
        syntax_report.record(
            if raw.trim_start().starts_with('\u{feff}') && document.start <= outer.start {
                JsonSyntaxRepairKind::RemoveBom
            } else {
                JsonSyntaxRepairKind::UnwrapMarkdownFence
            },
            document.start,
            "envelope",
        );
    }

    Ok(FramedJson {
        source: raw[document.start..document.end].to_string(),
        findings,
        edits,
        syntax_report,
    })
}

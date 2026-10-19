// Origin: app/backend/core/src/outline_agent_output_contract.rs::decode_doe_traditional_outline_without_schema_validation
use super::*;
/// Production DOE Outline adapter. The strict decoder above is intentionally
/// retained for diagnostics, but generation no longer calls it as a gate.
/// Any syntactically valid JSON is reduced to the V1 storage shape while
/// preserving its textual business content in reading order.
pub fn decode_doe_traditional_outline_without_schema_validation(
    raw: &str,
) -> Result<DecodedDoeOutlineOutput, String> {
    if crate::presentation::outline::markdown::is_markdown(raw) {
        return crate::presentation::outline::markdown::decode(raw);
    }
    if raw.trim().is_empty() {
        return Err(format!("{EMPTY_OUTPUT_ERROR}: response content was empty"));
    }
    if raw.len() > MAX_OUTPUT_BYTES {
        return Err(format!(
            "{OUTPUT_TOO_LARGE_ERROR}: response exceeded {MAX_OUTPUT_BYTES} bytes"
        ));
    }
    // DOE content/schema validation is intentionally disabled here, but the
    // production boundary still needs one unambiguous JSON document. Reuse the
    // bounded compiler for transport-only normalization (BOM/fence removal and
    // delimiter repair). Its proof guarantees duplicate-key rejection,
    // idempotent canonicalization, and preservation of decoded business
    // strings; it does not run the Outline content contract in this adapter.
    let compiled = outline_recovery::compile_json(raw, |_| Some(0))
        .map_err(|error| format!("{INVALID_JSON_ERROR}: {error}"))?;
    let syntax_repair_count = compiled.syntax_report.count();
    let syntax_repair_summary = compiled.syntax_report.summary();
    let value = compiled.value;
    let envelope = value.as_object();
    let operation = match envelope
        .and_then(|object| object.get("operation"))
        .and_then(Value::as_str)
    {
        Some("replace") => OutlineOperation::Replace,
        Some("edit") => OutlineOperation::Edit,
        _ => OutlineOperation::Create,
    };
    let expected_revision = envelope
        .and_then(|object| object.get("expected_revision"))
        .and_then(Value::as_i64)
        .filter(|revision| *revision > 0);
    let outline_value = envelope
        .and_then(|object| object.get("outline"))
        .unwrap_or(&value);
    let outline_object = outline_value.as_object();
    let raw_slides = outline_object
        .and_then(|object| object.get("body").or_else(|| object.get("slides")))
        .and_then(Value::as_array);

    fn truncate(value: &str, max_chars: usize) -> String {
        value.trim().chars().take(max_chars).collect()
    }

    fn collect_text(value: &Value, output: &mut Vec<String>) {
        match value {
            Value::String(text) => {
                let text = truncate(
                    text,
                    crate::presentation::outline::recovery::contract::MAX_OUTLINE_CONTENT_LEN,
                );
                if !text.is_empty() {
                    output.push(text);
                }
            }
            Value::Array(items) => {
                for item in items {
                    collect_text(item, output);
                }
            }
            Value::Object(object) => {
                for item in object.values() {
                    collect_text(item, output);
                }
            }
            Value::Null => {}
            scalar => output.push(scalar.to_string()),
        }
    }

    let mut body = Vec::new();
    if let Some(raw_slides) = raw_slides {
        for (index, slide) in raw_slides
            .iter()
            .take(crate::presentation::outline::recovery::contract::MAX_OUTLINE_SLIDES)
            .enumerate()
        {
            let content_value = slide
                .as_object()
                .and_then(|object| {
                    object
                        .get("contents")
                        .or_else(|| object.get("contents_json"))
                })
                .unwrap_or(slide);
            let mut contents = Vec::new();
            if let Some(encoded) = content_value.as_str() {
                if let Ok(decoded) = serde_json::from_str::<Value>(encoded) {
                    collect_text(&decoded, &mut contents);
                } else {
                    collect_text(content_value, &mut contents);
                }
            } else {
                collect_text(content_value, &mut contents);
            }
            contents.truncate(crate::presentation::outline::recovery::contract::MAX_OUTLINE_CONTENT_ITEMS);
            if contents.is_empty() {
                contents.push(format!("Page {}", index + 1));
            }
            body.push(crate::presentation::outline::input::OutlineSlideInput {
                index: Some(index as i64 + 1),
                page: Some(index as i64 + 1),
                contents,
            });
        }
    }
    if body.is_empty() {
        let mut contents = Vec::new();
        collect_text(outline_value, &mut contents);
        contents.truncate(crate::presentation::outline::recovery::contract::MAX_OUTLINE_CONTENT_ITEMS);
        if contents.is_empty() {
            contents.push("Untitled presentation".to_string());
        }
        body.push(crate::presentation::outline::input::OutlineSlideInput {
            index: Some(1),
            page: Some(1),
            contents,
        });
    }

    for slide in &mut body {
        for content in &mut slide.contents {
            if let Some(normalized) =
                crate::presentation::outline::image_placeholder::normalize_marker_source(content)
            {
                *content = normalized;
            }
        }
    }

    let title = outline_object
        .and_then(|object| object.get("title"))
        .and_then(Value::as_str)
        .map(|title| truncate(title, 300))
        .filter(|title| !title.is_empty())
        .unwrap_or_else(|| truncate(&body[0].contents[0], 300));
    let outline = OutlineInput {
        title: if title.is_empty() {
            "Untitled presentation".to_string()
        } else {
            title
        },
        page_count: Some(body.len() as i64),
        body,
        slides: None,
    };
    let canonical_outline = json!({
        "title": outline.title.clone(),
        "page_count": outline.page_count,
        "body": outline.body.iter().map(|slide| json!({
            "index": slide.index,
            "page": slide.page,
            "contents": &slide.contents,
        })).collect::<Vec<_>>(),
    });
    let canonical_json = serde_json::to_string(&json!({
        "operation": operation,
        "expected_revision": expected_revision,
        "outline": canonical_outline,
    }))
    .map_err(|error| format!("{INVALID_JSON_ERROR}: {error}"))?;

    Ok(DecodedDoeOutlineOutput {
        operation,
        expected_revision,
        outline,
        canonical_json,
        syntax_repair_count,
        syntax_repair_summary,
    })
}

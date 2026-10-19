// Origin: app/backend/core/src/outline_agent_output_contract.rs::decode_doe_traditional_outline
use super::*;


pub fn decode_doe_traditional_outline(raw: &str) -> Result<DecodedDoeOutlineOutput, String> {
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
    let value = serde_json::from_str::<Value>(raw)
        .map_err(|error| format!("{INVALID_JSON_ERROR}: {error}"))?;
    let envelope = serde_json::from_value::<DoeOutlineEnvelope>(value)
        .map_err(|error| format!("{SCHEMA_MISMATCH_ERROR}: {error}"))?;
    let outline = serde_json::from_value::<OutlineInput>(envelope.outline.clone())
        .map_err(|error| format!("{SCHEMA_MISMATCH_ERROR}: {error}"))?;
    if outline.slides.is_some() {
        return Err(format!(
            "{SCHEMA_MISMATCH_ERROR}: DOE Outline must use the traditional title/page_count/body schema"
        ));
    }
    let canonical_json = serde_json::to_string(&json!({
        "operation": envelope.operation,
        "expected_revision": envelope.expected_revision,
        "outline": envelope.outline,
    }))
    .map_err(|error| format!("{INVALID_JSON_ERROR}: {error}"))?;

    Ok(DecodedDoeOutlineOutput {
        operation: envelope.operation,
        expected_revision: envelope.expected_revision,
        outline,
        canonical_json,
        syntax_repair_count: 0,
        syntax_repair_summary: String::new(),
    })
}

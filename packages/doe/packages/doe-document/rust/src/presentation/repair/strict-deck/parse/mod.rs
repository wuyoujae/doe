// Origin: app/backend/core/src/slide_auto_repair_v2/strict_deck.rs::parse
use super::*;


pub(in super::super) fn parse(
    raw: &str,
    expectations: SlideDeckExpectations,
    allowed_image_sources: &[String],
    normalize_theme_managed_fields: bool,
) -> Result<StrictDeckOutput, String> {
    if raw.trim().is_empty() {
        return Err(format!("{EMPTY_OUTPUT_ERROR}: response body was empty"));
    }
    if raw.len() > MAX_OUTPUT_BYTES {
        return Err(format!(
            "{OUTPUT_TOO_LARGE_ERROR}: response exceeded {MAX_OUTPUT_BYTES} bytes"
        ));
    }

    let (mut value, json_syntax_repaired) = if normalize_theme_managed_fields {
        let repaired =
            doe_core::json::syntax::parse_json_with_syntax_repair_ranked_source(raw, |value| {
                value
                    .get("deck")
                    .and_then(serde_json::Value::as_object)?
                    .get("slides")
                    .and_then(serde_json::Value::as_array)
                    .map(|_| 0)
            })
            .map_err(|error| format!("{INVALID_JSON_ERROR}: {error}"))?;
        let changed = repaired.report.count() > 0;
        (repaired.value, changed)
    } else {
        (
            serde_json::from_str::<serde_json::Value>(raw)
                .map_err(|error| format!("{INVALID_JSON_ERROR}: {error}"))?,
            false,
        )
    };
    let theme_managed_fields_removed = if normalize_theme_managed_fields {
        let original = value.clone();
        slide_agent_output_contract::normalize_theme_managed_component_styles(&mut value);
        slide_agent_output_contract::normalize_agent_theme_managed_layout_fields(&mut value);
        value != original
    } else {
        false
    };
    let component_content_shapes_normalized = normalize_theme_managed_fields
        && slide_agent_output_contract::normalize_agent_component_content_shapes(&mut value) > 0;
    slide_agent_output_contract::validate_agent_image_sources_strict(
        &value,
        allowed_image_sources,
    )?;
    let value_before_storage_adaptation = value.clone();
    let parsed =
        slide_agent_output_contract::parsed_agent_deck_without_schema_validation(value, 0)?;
    if parsed.slides.len() != expectations.slide_count {
        return Err(format!(
            "{SCHEMA_MISMATCH_ERROR}: root.deck.slides must contain exactly {} slides",
            expectations.slide_count
        ));
    }
    let storage_shape_normalized =
        serde_json::from_str::<serde_json::Value>(&parsed.canonical_json)
            .map_err(|error| error.to_string())?
            != value_before_storage_adaptation;
    let output = if json_syntax_repaired
        || theme_managed_fields_removed
        || component_content_shapes_normalized
        || storage_shape_normalized
    {
        parsed.canonical_json.clone()
    } else {
        raw.to_string()
    };
    Ok(StrictDeckOutput {
        parsed,
        output,
        json_syntax_repaired,
        theme_managed_fields_removed,
        component_content_shapes_normalized,
        storage_shape_normalized,
    })
}

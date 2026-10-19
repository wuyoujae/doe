// Origin: app/backend/core/src/slide_recovery/model_io.rs::parse_page_repair_response
use super::*;


pub fn parse_page_repair_response(
    raw: &str,
    plan: &SlidePageRepairPlan,
) -> Result<Vec<SlidePageReplacement>, String> {
    if raw.trim().is_empty() {
        return Err("slide_recovery_model_output_empty".to_string());
    }
    if raw.len() > MAX_INTERNAL_MODEL_OUTPUT_BYTES {
        return Err("slide_recovery_model_output_too_large".to_string());
    }
    let value = match duplicate_json::parse(raw) {
        Ok(parsed) if parsed.equal_paths.is_empty() && parsed.conflicting_paths.is_empty() => {
            parsed.value
        }
        Ok(_) => return Err("slide_recovery_model_output_duplicate_key".to_string()),
        Err(_) => {
            doe_core::json::syntax::parse_json_with_syntax_repair_ranked_source(
                raw,
                |candidate| {
                    candidate
                        .get("base_deck_sha256")
                        .and_then(Value::as_str)
                        .is_some_and(|hash| hash == plan.base_deck_sha256)
                        .then_some(0)
                },
            )
            .map_err(|_| "slide_recovery_model_output_invalid_json".to_string())?
            .value
        }
    };
    let value = normalize_repair_response_envelope(value)?;
    let root = exact_object(&value, &["base_deck_sha256", "repairs"], "repair response")?;
    if root.get("base_deck_sha256").and_then(Value::as_str) != Some(plan.base_deck_sha256.as_str())
    {
        return Err("slide_recovery_model_output_stale_base".to_string());
    }
    let repairs = root
        .get("repairs")
        .and_then(Value::as_array)
        .ok_or_else(|| "slide_recovery_model_output_repairs_type".to_string())?;
    if repairs.len() != plan.targets.len() {
        return Err("slide_recovery_model_output_scope_count".to_string());
    }
    repairs
        .iter()
        .map(|repair| {
            let object = exact_object(
                repair,
                &["page_index", "expected_page_sha256", "slide"],
                "page repair",
            )?;
            let page_index = object
                .get("page_index")
                .and_then(Value::as_u64)
                .and_then(|value| usize::try_from(value).ok())
                .ok_or_else(|| "slide_recovery_model_output_page_index".to_string())?;
            let expected_page_sha256 = object
                .get("expected_page_sha256")
                .and_then(Value::as_str)
                .filter(|value| value.len() == 64)
                .ok_or_else(|| "slide_recovery_model_output_page_hash".to_string())?
                .to_string();
            let slide = object
                .get("slide")
                .filter(|value| value.is_object())
                .ok_or_else(|| "slide_recovery_model_output_slide".to_string())?
                .clone();
            Ok(SlidePageReplacement {
                page_index,
                expected_page_sha256,
                slide,
            })
        })
        .collect()
}

// Origin: app/backend/core/src/slide_recovery/model_io.rs::grounded_fallback_replacements
use super::*;


pub(super) fn grounded_fallback_replacements(
    plan: &SlidePageRepairPlan,
    provider_context: &Value,
    profile: GroundedFallbackProfile,
) -> Result<Vec<SlidePageReplacement>, String> {
    let outline_slides = provider_context
        .get("confirmed_outline")
        .and_then(|outline| outline.get("outline"))
        .and_then(|outline| outline.get("slides"))
        .and_then(Value::as_array)
        .ok_or_else(|| "slide_recovery_fallback_outline_missing".to_string())?;
    plan.targets
        .iter()
        .map(|target| {
            let outline_page = outline_slides
                .get(target.page_index)
                .ok_or_else(|| "slide_recovery_fallback_outline_page_missing".to_string())?;
            let text = grounded_outline_strings(outline_page);
            let title = text
                .first()
                .cloned()
                .ok_or_else(|| "slide_recovery_fallback_grounding_missing".to_string())?;
            let body = match profile {
                GroundedFallbackProfile::Compact => truncate_text(
                    &text
                        .iter()
                        .skip(1)
                        .take(6)
                        .cloned()
                        .collect::<Vec<_>>()
                        .join("\n"),
                    500,
                ),
                GroundedFallbackProfile::Minimal => String::new(),
            };
            let slide_id = valid_existing_id(&target.slide, "id")
                .unwrap_or_else(|| format!("slide-{:02}", target.page_index + 1));
            let mut blocks = vec![json!({
                "id": format!("{slide_id}-heading"),
                "type": "heading",
                "props": {"text": truncate_text(&title, match profile {
                    GroundedFallbackProfile::Compact => 96,
                    GroundedFallbackProfile::Minimal => 64,
                })}
            })];
            if !body.trim().is_empty() {
                blocks.push(json!({
                    "id": format!("{slide_id}-body"),
                    "type": "text",
                    "props": {"text": body}
                }));
            }
            Ok(SlidePageReplacement {
                page_index: target.page_index,
                expected_page_sha256: target.page_sha256.clone(),
                slide: json!({
                    "id": slide_id,
                    "size": {"width": 960, "height": 540, "unit": "pt"},
                    "blocks": blocks,
                }),
            })
        })
        .collect()
}

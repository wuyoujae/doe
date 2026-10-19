// Origin: app/backend/core/src/slide_recovery/mod.rs::verify_deck_envelope_with_placeholders
use super::*;


pub(super) fn verify_deck_envelope_with_placeholders(
    candidate: &Value,
    expectations: SlideDeckExpectations,
    invalid_indices: &BTreeSet<usize>,
) -> Result<(), String> {
    let mut envelope_probe = candidate.clone();
    let slides = envelope_probe
        .get_mut("deck")
        .and_then(|deck| deck.get_mut("slides"))
        .and_then(Value::as_array_mut)
        .ok_or_else(|| {
            "slide_recovery_page_plan_unavailable: candidate slides missing".to_string()
        })?;
    for page_index in invalid_indices {
        slides[*page_index] = json!({
            "id": format!("__yrkie_repair_placeholder_{}", page_index + 1),
            "size": {"width": 960, "height": 540, "unit": "pt"},
            "blocks": [{
                "id": format!("__yrkie_repair_placeholder_{}_heading", page_index + 1),
                "type": "heading",
                "props": {"text": format!("Page {}", page_index + 1)}
            }]
        });
    }
    slide_agent_output_contract::validate_deck_value(&envelope_probe, expectations).map_err(
        |error| format!("slide_recovery_page_plan_unavailable: Deck envelope failed: {error}"),
    )
}

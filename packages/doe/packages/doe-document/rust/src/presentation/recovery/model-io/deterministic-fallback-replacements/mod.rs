// Origin: app/backend/core/src/slide_recovery/model_io.rs::deterministic_fallback_replacements
use super::*;


pub fn deterministic_fallback_replacements(
    plan: &SlidePageRepairPlan,
    provider_context: &Value,
) -> Result<Vec<SlidePageReplacement>, String> {
    grounded_fallback_replacements(plan, provider_context, GroundedFallbackProfile::Compact)
}

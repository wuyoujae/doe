// Origin: app/backend/core/src/slide_recovery/grounding.rs::factual_claim_policy
use super::*;


pub(crate) fn factual_claim_policy(provider_context: &Value) -> &'static str {
    use crate::presentation::outline::factual_policy::{
        compile_factual_claim_policy_from_values, FACTUAL_POLICY_GROUNDED,
        FACTUAL_POLICY_SYNTHETIC_ALLOWED,
    };

    match provider_context
        .get("factual_claim_policy")
        .and_then(Value::as_str)
    {
        Some(FACTUAL_POLICY_SYNTHETIC_ALLOWED) => FACTUAL_POLICY_SYNTHETIC_ALLOWED,
        Some(FACTUAL_POLICY_GROUNDED) => FACTUAL_POLICY_GROUNDED,
        Some(_) => FACTUAL_POLICY_GROUNDED,
        None => {
            let mut values = Vec::new();
            if let Some(delegation) = provider_context.get("delegation") {
                values.push(delegation);
            }
            if let Some(outline) = provider_context
                .get("confirmed_outline")
                .and_then(|value| value.get("outline"))
            {
                values.push(outline);
            }
            compile_factual_claim_policy_from_values(&values)
        }
    }
}

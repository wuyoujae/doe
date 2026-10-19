// Origin: app/backend/core/src/slide_recovery/grounding.rs::synthetic_data_allowed
use super::*;


pub(super) fn synthetic_data_allowed(provider_context: &Value) -> bool {
    factual_claim_policy(provider_context)
        == crate::presentation::outline::factual_policy::FACTUAL_POLICY_SYNTHETIC_ALLOWED
}

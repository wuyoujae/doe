// Origin: app/backend/core/src/outline_recovery/circuit_breaker.rs::record_deterministic_recovery_defect
use super::*;


pub fn record_deterministic_recovery_defect() {
    if let Ok(mut state) = state().lock() {
        state.record_defect(now_seconds());
    }
}

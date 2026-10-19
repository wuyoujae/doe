// Origin: app/backend/core/src/outline_recovery/circuit_breaker.rs::deterministic_recovery_is_open
use super::*;


pub fn deterministic_recovery_is_open() -> bool {
    state()
        .lock()
        .is_ok_and(|state| state.is_open(now_seconds()))
}

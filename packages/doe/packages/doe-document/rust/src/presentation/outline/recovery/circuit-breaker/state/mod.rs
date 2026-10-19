// Origin: app/backend/core/src/outline_recovery/circuit_breaker.rs::state
use super::*;


pub(super) fn state() -> &'static Mutex<CircuitState> {
    static STATE: OnceLock<Mutex<CircuitState>> = OnceLock::new();
    STATE.get_or_init(|| Mutex::new(CircuitState::default()))
}

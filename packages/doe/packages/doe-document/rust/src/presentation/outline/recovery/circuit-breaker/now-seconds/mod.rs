// Origin: app/backend/core/src/outline_recovery/circuit_breaker.rs::now_seconds
use super::*;


pub(super) fn now_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |duration| duration.as_secs())
}

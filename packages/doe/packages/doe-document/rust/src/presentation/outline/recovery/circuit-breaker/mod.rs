use std::collections::VecDeque;

use std::sync::{Mutex, OnceLock};

use std::time::{SystemTime, UNIX_EPOCH};


const FAILURE_THRESHOLD: usize = 3;

const FAILURE_WINDOW_SECONDS: u64 = 5 * 60;

const OPEN_SECONDS: u64 = 5 * 60;


#[derive(Debug, Default)]
struct CircuitState {
    failures: VecDeque<u64>,
    open_until: u64,
}


impl CircuitState {
    fn record_defect(&mut self, now: u64) {
        while self
            .failures
            .front()
            .is_some_and(|failure| now.saturating_sub(*failure) > FAILURE_WINDOW_SECONDS)
        {
            self.failures.pop_front();
        }
        self.failures.push_back(now);
        if self.failures.len() >= FAILURE_THRESHOLD {
            self.open_until = now.saturating_add(OPEN_SECONDS);
            self.failures.clear();
        }
    }

    fn is_open(&self, now: u64) -> bool {
        now < self.open_until
    }
}
#[path = "state/mod.rs"]
mod function_state;
 use function_state::state;

#[path = "now-seconds/mod.rs"]
mod function_now_seconds;
 use function_now_seconds::now_seconds;

#[path = "record-deterministic-recovery-defect/mod.rs"]
mod function_record_deterministic_recovery_defect;
pub use function_record_deterministic_recovery_defect::record_deterministic_recovery_defect;

#[path = "deterministic-recovery-is-open/mod.rs"]
mod function_deterministic_recovery_is_open;
pub use function_deterministic_recovery_is_open::deterministic_recovery_is_open;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;



    use super::*;

    #[test]
    fn circuit_opens_only_after_repeated_defects_and_recovers_after_cooldown() {
        let mut state = CircuitState::default();
        state.record_defect(100);
        state.record_defect(101);
        assert!(!state.is_open(101));
        state.record_defect(102);
        assert!(state.is_open(102));
        assert!(!state.is_open(102 + OPEN_SECONDS));
    }

    #[test]
    fn old_defects_do_not_accumulate_forever() {
        let mut state = CircuitState::default();
        state.record_defect(1);
        state.record_defect(2);
        state.record_defect(FAILURE_WINDOW_SECONDS + 10);
        assert!(!state.is_open(FAILURE_WINDOW_SECONDS + 10));
    }

// Origin: app/backend/core/src/outline_agent_output_contract.rs::parse_and_validate_safely
use super::*;


pub fn parse_and_validate_safely(raw: &str) -> Result<ParsedOutlineOutput, String> {
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| parse_and_validate(raw)))
        .unwrap_or_else(|_| {
            outline_recovery::circuit_breaker::record_deterministic_recovery_defect();
            Err(format!(
                "{INVALID_JSON_ERROR}: parser rejected malformed output safely"
            ))
        })
}

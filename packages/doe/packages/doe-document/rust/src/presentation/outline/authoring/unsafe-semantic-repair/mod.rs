// Origin: app/backend/core/src/outline_agent_output_contract.rs::unsafe_semantic_repair
use super::*;


pub(super) fn unsafe_semantic_repair(path: &str) -> String {
    format!(
        "{OUTPUT_CONTRACT_VIOLATION_ERROR}: deterministic semantic change at {path} is not uniquely authorized by the Contract Graph"
    )
}

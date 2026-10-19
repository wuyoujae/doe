// Origin: app/backend/core/src/outline_agent_output_contract.rs::quarantinable_transport_field
use super::*;


pub(super) fn quarantinable_transport_field(path: &str, key: &str) -> bool {
    let scope = if path.is_empty() {
        "envelope"
    } else {
        "outline"
    };
    OutlineContractGraph::current().quarantinable_unknown_field(scope, key)
}

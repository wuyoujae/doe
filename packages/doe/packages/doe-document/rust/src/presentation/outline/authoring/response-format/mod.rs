// Origin: app/backend/core/src/outline_agent_output_contract.rs::response_format
use super::*;


pub fn response_format() -> Value {
    OutlineContractGraph::current().provider_response_format()
}

// Origin: app/backend/core/src/outline_agent_output_contract.rs::parse_json_with_bounded_syntax_repair
use super::*;


pub fn parse_json_with_bounded_syntax_repair(raw: &str) -> Result<(Value, usize), String> {
    parse_outline_contents_with_report(raw).map(|(value, report, _)| (value, report.count()))
}

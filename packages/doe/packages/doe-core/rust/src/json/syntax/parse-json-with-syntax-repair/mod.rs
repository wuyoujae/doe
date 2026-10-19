// Origin: app/backend/core/src/json_syntax_repair.rs::parse_json_with_syntax_repair
use super::*;


#[cfg(test)]
pub fn parse_json_with_syntax_repair(
    raw: &str,
) -> Result<(Value, JsonSyntaxRepairReport), serde_json::Error> {
    parse_json_with_syntax_repair_ranked(raw, |_| Some(0))
}

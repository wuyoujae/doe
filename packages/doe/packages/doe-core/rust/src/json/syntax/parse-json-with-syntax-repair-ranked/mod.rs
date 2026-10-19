// Origin: app/backend/core/src/json_syntax_repair.rs::parse_json_with_syntax_repair_ranked
use super::*;


pub fn parse_json_with_syntax_repair_ranked(
    raw: &str,
    rank: impl Fn(&Value) -> Option<usize>,
) -> Result<(Value, JsonSyntaxRepairReport), serde_json::Error> {
    let result = parse_json_with_syntax_repair_ranked_source(raw, rank)?;
    Ok((result.value, result.report))
}

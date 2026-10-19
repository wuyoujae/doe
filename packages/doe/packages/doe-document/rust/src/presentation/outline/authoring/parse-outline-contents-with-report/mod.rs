// Origin: app/backend/core/src/outline_agent_output_contract.rs::parse_outline_contents_with_report
use super::*;


pub(super) fn parse_outline_contents_with_report(
    raw: &str,
) -> Result<
    (
        Value,
        JsonSyntaxRepairReport,
        Vec<outline_recovery::diagnostics::RepairEdit>,
    ),
    String,
> {
    let compiled = outline_recovery::compile_json(raw, rank_outline_contents_candidate)?;
    Ok((compiled.value, compiled.syntax_report, compiled.proof.edits))
}

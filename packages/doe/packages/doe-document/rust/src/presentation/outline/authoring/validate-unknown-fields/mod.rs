// Origin: app/backend/core/src/outline_agent_output_contract.rs::validate_unknown_fields
use super::*;


pub(super) fn validate_unknown_fields(
    object: &Map<String, Value>,
    known: &[&str],
    scope: &str,
) -> Result<usize, String> {
    let mut quarantined = 0usize;
    for key in object.keys().filter(|key| !known.contains(&key.as_str())) {
        if OutlineContractGraph::current().quarantinable_unknown_field(scope, key) {
            quarantined = quarantined.saturating_add(1);
        } else {
            return Err(format!(
                "{SCHEMA_MISMATCH_ERROR}: {scope}.{key} is unknown and may contain business data"
            ));
        }
    }
    Ok(quarantined)
}

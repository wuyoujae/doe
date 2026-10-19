// Origin: app/backend/core/src/slide_agent_output_contract.rs::parse_json_with_bounded_delimiter_repair
use super::*;


pub(super) fn parse_json_with_bounded_delimiter_repair(raw: &str) -> Result<Value, String> {
    match doe_core::json::duplicate::parse_strict(raw) {
        Ok(value) => Ok(value),
        Err(original_error) => {
            if original_error.contains("duplicate object key") {
                return Err(format!("{INVALID_JSON_ERROR}: {original_error}"));
            }
            let key_repaired = repair_missing_structural_key_quotes(raw);
            if let Some(repaired) = key_repaired.as_deref() {
                if let Ok(value) = doe_core::json::duplicate::parse_strict(repaired) {
                    return Ok(value);
                }
            }

            let delimiter_source = key_repaired.as_deref().unwrap_or(raw);
            let repaired = repair_missing_json_delimiters(delimiter_source)
                .ok_or_else(|| format!("{INVALID_JSON_ERROR}: {original_error}"))?;
            doe_core::json::duplicate::parse_strict(&repaired)
                .map_err(|_| format!("{INVALID_JSON_ERROR}: {original_error}"))
        }
    }
}

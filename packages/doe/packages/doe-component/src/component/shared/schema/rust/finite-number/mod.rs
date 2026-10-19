// Origin: app/backend/core/src/slide_agent_output_contract.rs::finite_number
use crate::schema::*;


pub fn finite_number(value: &Value, path: &str) -> Result<f64, String> {
    value
        .as_f64()
        .filter(|value| value.is_finite())
        .ok_or_else(|| format!("{SCHEMA_MISMATCH_ERROR}: {path} must be a finite number"))
}

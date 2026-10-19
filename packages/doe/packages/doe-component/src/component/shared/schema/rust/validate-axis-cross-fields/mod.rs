// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_axis_cross_fields
use crate::schema::*;


pub fn validate_axis_cross_fields(content: &Map<String, Value>, path: &str) -> Result<(), String> {
    if let Some(interval) = content.get("tickInterval") {
        if finite_number(interval, &format!("{path}.tickInterval"))? <= 0.0 {
            return mismatch(format!("{path}.tickInterval must be greater than 0"));
        }
    }
    if let (Some(minimum), Some(maximum)) = (content.get("minValue"), content.get("maxValue")) {
        let minimum = finite_number(minimum, &format!("{path}.minValue"))?;
        let maximum = finite_number(maximum, &format!("{path}.maxValue"))?;
        if minimum > maximum {
            return mismatch(format!("{path}.minValue cannot exceed maxValue"));
        }
    }
    Ok(())
}

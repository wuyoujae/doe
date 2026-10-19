// Origin: app/backend/core/src/slide_agent_output_contract.rs::string_array
use crate::schema::*;


pub fn string_array(value: &Value, path: &str, min: usize, max: usize) -> Result<usize, String> {
    let values = array(value, path)?;
    if values.len() < min || values.len() > max {
        return Err(format!(
            "{SCHEMA_MISMATCH_ERROR}: {path} must contain between {min} and {max} strings"
        ));
    }
    for (index, value) in values.iter().enumerate() {
        nonempty_text(value, &format!("{path}[{index}]"))?;
    }
    Ok(values.len())
}

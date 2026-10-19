// Origin: app/backend/core/src/slide_agent_output_contract.rs::reject_authorable_nulls
use super::*;


pub(super) fn reject_authorable_nulls(value: &Value, path: &str) -> Result<(), String> {
    match value {
        Value::Null => mismatch(format!("{path} cannot be null in new Agent output")),
        Value::Array(items) => {
            for (index, item) in items.iter().enumerate() {
                reject_authorable_nulls(item, &format!("{path}[{index}]"))?;
            }
            Ok(())
        }
        Value::Object(object) => {
            for (key, item) in object {
                reject_authorable_nulls(item, &format!("{path}.{key}"))?;
            }
            Ok(())
        }
        _ => Ok(()),
    }
}

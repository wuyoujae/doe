// Origin: app/backend/core/src/doe_slide_edit/validation.rs::changed_safety
use super::*;


pub(super) fn changed_safety(before: &Value, after: &Value, key: &str) -> Result<(), Failure> {
    if before == after {
        return Ok(());
    }
    match (before, after) {
        (Value::Object(old), Value::Object(new)) => {
            for (key, value) in new {
                changed_safety(old.get(key).unwrap_or(&Value::Null), value, key)?;
            }
        }
        (Value::Array(old), Value::Array(new)) => {
            for (index, value) in new.iter().enumerate() {
                let previous = if matches!(key, "blocks" | "children") {
                    old.iter().find(|entry| entry["id"] == value["id"])
                } else {
                    old.get(index)
                };
                changed_safety(previous.unwrap_or(&Value::Null), value, key)?;
            }
        }
        _ => crate::presentation::schema::safety::edit_safety(&json!({key:after}))?,
    }
    Ok(())
}

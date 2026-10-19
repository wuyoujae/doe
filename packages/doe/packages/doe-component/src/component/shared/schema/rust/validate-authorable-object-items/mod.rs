// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_object_items
use crate::schema::*;


pub fn validate_authorable_object_items(
    parent: &Map<String, Value>,
    key: &str,
    path: &str,
    item_keys: &[&str],
) -> Result<(), String> {
    let Some(items) = parent.get(key) else {
        return Ok(());
    };
    for (index, item) in array(items, &format!("{path}.{key}"))?.iter().enumerate() {
        let item_path = format!("{path}.{key}[{index}]");
        allowed_keys(object(item, &item_path)?, item_keys, &item_path)?;
    }
    Ok(())
}

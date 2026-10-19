// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_object_items
use crate::schema::*;


pub fn validate_object_items<F>(
    props: &Map<String, Value>,
    path: &str,
    key: &str,
    min: usize,
    max: usize,
    mut validate: F,
) -> Result<(), String>
where
    F: FnMut(&Map<String, Value>, &str) -> Result<(), String>,
{
    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    let items = array(
        required(content, key, &content_path)?,
        &format!("{content_path}.{key}"),
    )?;
    if items.len() < min || items.len() > max {
        return mismatch(format!(
            "{content_path}.{key} must contain between {min} and {max} items"
        ));
    }
    for (index, item) in items.iter().enumerate() {
        let item_path = format!("{content_path}.{key}[{index}]");
        validate(object(item, &item_path)?, &item_path)?;
    }
    Ok(())
}

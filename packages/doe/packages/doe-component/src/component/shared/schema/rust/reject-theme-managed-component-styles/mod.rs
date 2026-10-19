// Origin: app/backend/core/src/slide_agent_output_contract.rs::reject_theme_managed_component_styles
use crate::schema::*;


pub fn reject_theme_managed_component_styles(value: &Value, path: &str) -> Result<(), String> {
    match value {
        Value::Array(items) => {
            for (index, item) in items.iter().enumerate() {
                reject_theme_managed_component_styles(item, &format!("{path}[{index}]"))?;
            }
        }
        Value::Object(object) => {
            for (key, item) in object {
                if is_theme_managed_component_style_key(key) {
                    return mismatch(format!(
                        "{path}.{key} is theme-managed and cannot be authored"
                    ));
                }
                reject_theme_managed_component_styles(item, &format!("{path}.{key}"))?;
            }
        }
        _ => {}
    }
    Ok(())
}

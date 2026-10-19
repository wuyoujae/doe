// Component contract from validate_component_props: "todo-list"
use crate::schema::*;

pub(crate) fn validate_component_props_todo_list(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let items_path = format!("{path}.items");
            let items = array(required(props, "items", path)?, &items_path)?;
            if items.is_empty() || items.len() > 100 { return mismatch(format!("{items_path} requires 1 to 100 items")); }
            for (index, value) in items.iter().enumerate() {
                let item_path = format!("{items_path}[{index}]");
                let item = object(value, &item_path)?;
                required_text(item, "text", &item_path)?;
                if !required(item, "checked", &item_path)?.is_boolean() { return mismatch(format!("{item_path}.checked must be a boolean")); }
            }
            Ok(())
        }
}

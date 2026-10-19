// Component contract from validate_component_props: "item-cards"
use crate::schema::*;

pub(crate) fn validate_component_props_item_cards(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let items_path = format!("{path}.items");
            let items = array(required(props, "items", path)?, &items_path)?;
            if items.is_empty() || items.len() > 12 { return mismatch(format!("{items_path} requires 1 to 12 items")); }
            for (index, value) in items.iter().enumerate() {
                let item_path = format!("{items_path}[{index}]");
                let item = object(value, &item_path)?;
                required_text(item, "title", &item_path)?;
                required_text(item, "text", &item_path)?;
                validate_authorable_optional_text(item, "icon", &item_path)?;
            }
            Ok(())
        }
}

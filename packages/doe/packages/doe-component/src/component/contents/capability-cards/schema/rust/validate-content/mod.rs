// Component contract from validate_component_props: "capability-cards"
use crate::schema::*;

pub(crate) fn validate_component_props_capability_cards(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_object_items(props, path, "items", 1, 6, |item, item_path| {
                required_text(item, "title", item_path)?;
                required_text(item, "text", item_path)
            })
        }
}

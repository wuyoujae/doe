// Component contract from validate_authorable_component_shape: "item-cards"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_item_cards(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            allowed_keys(props, &["items", "variant", "itemLayout", "itemColumns"], path)?;
            validate_authorable_object_items(props, "items", path, &["title", "text", "icon"])
        }
}

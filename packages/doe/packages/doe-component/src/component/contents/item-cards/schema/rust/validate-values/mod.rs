// Component contract from validate_authorable_component_values: "item-cards"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_item_cards(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_authorable_optional_enum(props, "variant", path, &["filled", "filled-icon", "outline", "side-rule", "top-rule", "top-icon", "connected", "connected-icon", "leaf", "quote", "bubble"])?;
            validate_authorable_optional_enum(props, "itemLayout", path, &["auto", "stack", "grid"])?;
            validate_authorable_optional_integer_range(props, "itemColumns", path, 1, 4)
        }
}

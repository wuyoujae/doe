// Component contract from validate_authorable_component_values: "capability-cards" | "numbered-icon-cards"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_capability_cards_numbered_icon_cards(component_type: &str, props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_authorable_optional_text(props, "title", path)?;
            validate_authorable_optional_enum(props, "itemLayout", path, &["auto", "stack", "grid"])?;
            validate_authorable_optional_integer_range(props, "itemColumns", path, 1, 4)?;
            let content = content_object(props, path)?;
            for (index, item) in content["items"]
                .as_array()
                .expect("validated Card items")
                .iter()
                .enumerate()
            {
                let item_path = format!("{path}.content.items[{index}]");
                if component_type == "capability-cards" {
                    validate_authorable_optional_text(
                        object(item, &item_path)?,
                        "icon",
                        &item_path,
                    )?;
                }
            }
            Ok(())
        }
}

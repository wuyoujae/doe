// Component contract from validate_authorable_component_shape: "capability-cards"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_capability_cards(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let content = authorable_content(
                props,
                path,
                &["content", "title", "itemLayout", "itemColumns"],
                &["items"],
            )?;
            validate_authorable_object_items(
                content,
                "items",
                &format!("{path}.content"),
                &["title", "text", "icon"],
            )
        }
}

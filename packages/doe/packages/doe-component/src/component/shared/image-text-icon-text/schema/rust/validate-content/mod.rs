// Component contract from validate_component_props: "image-text" | "icon-text"
use crate::schema::*;

pub(crate) fn validate_component_props_image_text_icon_text(component_type: &str, props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            required_text(props, "title", path)?;
            required_text(props, "text", path)?;
            required_text(props, if component_type == "image-text" { "src" } else { "icon" }, path)
        }
}

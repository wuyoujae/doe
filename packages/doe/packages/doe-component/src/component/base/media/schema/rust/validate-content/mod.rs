// Component contract from validate_component_props: "media"
use crate::schema::*;

pub(crate) fn validate_component_props_media(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            required_text(props, "src", path)?;
            required_text(props, "alt", path)
        }
}

// Component contract from validate_authorable_component_shape: "icon-text"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_icon_text(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["icon", "title", "text"], path)
}

// Component contract from validate_authorable_component_shape: "shape-contents"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_shape_contents(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            allowed_keys(props, &["items", "variant"], path)?;
            validate_authorable_object_items(props, "items", path, &["title", "text", "icon"])
        }
}

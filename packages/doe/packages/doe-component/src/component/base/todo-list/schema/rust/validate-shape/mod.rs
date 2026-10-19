// Component contract from validate_authorable_component_shape: "todo-list"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_todo_list(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            allowed_keys(props, &["items", "title", "itemLayout", "itemColumns"], path)?;
            validate_authorable_object_items(props, "items", path, &["text", "checked"])
        }
}

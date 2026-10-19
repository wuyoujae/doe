// Component contract from validate_authorable_component_shape: "list" | "ordered-list"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_list_ordered_list(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(
            props,
            &["items", "title", "itemLayout", "itemColumns"],
            path,
        )
}

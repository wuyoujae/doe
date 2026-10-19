// Component contract from validate_authorable_component_values: "list" | "ordered-list" | "todo-list"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_list_ordered_list_todo_list(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_authorable_optional_text(props, "title", path)?;
            validate_authorable_optional_enum(
                props,
                "itemLayout",
                path,
                &["auto", "stack", "grid"],
            )?;
            validate_authorable_optional_integer_range(props, "itemColumns", path, 1, 2)
        }
}

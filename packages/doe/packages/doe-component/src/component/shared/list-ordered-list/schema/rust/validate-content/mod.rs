// Component contract from validate_component_props: "list" | "ordered-list"
use crate::schema::*;

pub(crate) fn validate_component_props_list_ordered_list(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    string_array(
            required(props, "items", path)?,
            &format!("{path}.items"),
            1,
            100,
        )
        .map(|_| ())
}

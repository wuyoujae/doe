// Component contract from validate_authorable_component_values: "stat"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_stat(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_authorable_optional_text(props, "label", path)?;
            validate_authorable_optional_text(props, "description", path)
        }
}

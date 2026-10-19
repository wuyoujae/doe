// Component contract from validate_authorable_component_values: "heading"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_heading(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_authorable_optional_integer_range(props, "level", path, 1, 3)?;
            validate_authorable_optional_enum(props, "variant", path, &["section", "plain", "display"])?;
            validate_authorable_optional_text(props, "kicker", path)
        }
}

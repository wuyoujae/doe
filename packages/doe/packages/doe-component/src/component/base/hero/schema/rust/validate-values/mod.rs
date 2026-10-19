// Component contract from validate_authorable_component_values: "hero"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_hero(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_authorable_optional_enum(props, "align", path, &["left", "center", "right"])?;
            validate_authorable_optional_text(props, "eyebrow", path)?;
            validate_authorable_optional_text(props, "icon", path)?;
            validate_authorable_optional_text(props, "subtitle", path)
        }
}

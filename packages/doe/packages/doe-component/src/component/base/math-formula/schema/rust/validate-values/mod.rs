// Component contract from validate_authorable_component_values: "math-formula"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_math_formula(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let content = content_object(props, path)?;
            let content_path = format!("{path}.content");
            validate_authorable_optional_bool(content, "display", &content_path)?;
            validate_authorable_optional_enum(
                content,
                "align",
                &content_path,
                &["left", "center", "right"],
            )
        }
}

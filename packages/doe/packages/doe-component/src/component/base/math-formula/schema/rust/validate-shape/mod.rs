// Component contract from validate_authorable_component_shape: "math-formula"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_math_formula(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            authorable_content(props, path, &["content"], &["formula", "display", "align"])?;
            Ok(())
        }
}

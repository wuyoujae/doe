// Component contract from validate_component_props: "math-formula"
use crate::schema::*;

pub(crate) fn validate_component_props_math_formula(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let content = content_object(props, path)?;
            required_text(content, "formula", &format!("{path}.content"))
        }
}

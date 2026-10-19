// Component contract from validate_authorable_component_values: "code-block"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_code_block(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_authorable_optional_enum(
                props,
                "language",
                path,
                &[
                    "python",
                    "javascript",
                    "typescript",
                    "json",
                    "html",
                    "css",
                    "sql",
                    "shell",
                    "text",
                ],
            )?;
            validate_authorable_optional_bool(props, "wrap", path)
        }
}

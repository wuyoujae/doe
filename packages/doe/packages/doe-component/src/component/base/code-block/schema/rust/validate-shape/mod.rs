// Component contract from validate_authorable_component_shape: "code-block"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_code_block(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["code", "language", "wrap"], path)
}

// Component contract from validate_authorable_component_values: "shape-contents"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_shape_contents(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_optional_enum(props, "variant", path, &["semicircle", "petals", "cycle-arrows", "full-circle", "ring", "stairs", "pyramid", "inverted-pyramid"])
}

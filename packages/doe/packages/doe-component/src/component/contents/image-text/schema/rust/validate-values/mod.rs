// Component contract from validate_authorable_component_values: "image-text"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_image_text(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_optional_text(props, "alt", path)?;
    for (key, values) in [
        ("imageSize", &["compact", "full"][..]),
        ("imageFit", &["contain", "cover"][..]),
        ("imageAspectRatio", &["1:1", "4:3", "3:4", "16:9"][..]),
        ("surface", &["none", "soft"][..]),
    ] {
        validate_authorable_optional_enum(props, key, path, values)?;
    }
    Ok(())
}

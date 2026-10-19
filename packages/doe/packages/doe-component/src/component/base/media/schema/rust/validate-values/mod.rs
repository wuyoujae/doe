// Component contract from validate_authorable_component_values: "media"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_media(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_authorable_optional_enum(props, "format", path, &["auto", "gif"])?;
            validate_authorable_optional_enum(
                props,
                "fit",
                path,
                &["auto", "natural", "contain", "cover", "fill"],
            )?;
            validate_authorable_optional_text(props, "position", path)?;
            validate_authorable_optional_enum(
                props,
                "aspectRatio",
                path,
                &["auto", "1:1", "4:3", "3:4", "16:9", "9:16"],
            )
        }
}

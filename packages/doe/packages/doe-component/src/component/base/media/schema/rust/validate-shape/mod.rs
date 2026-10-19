// Component contract from validate_authorable_component_shape: "media"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_media(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(
            props,
            &["src", "alt", "format", "fit", "position", "aspectRatio"],
            path,
        )
}

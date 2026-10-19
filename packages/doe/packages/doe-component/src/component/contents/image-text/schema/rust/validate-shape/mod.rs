// Component contract from validate_authorable_component_shape: "image-text"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_image_text(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["src", "alt", "title", "text", "imageSize", "imageFit", "imageAspectRatio", "surface"], path)
}

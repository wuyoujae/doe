use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum GeneratedImageType {
    Content,
    #[default]
    Decorative,
}

impl GeneratedImageType {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Content => "content",
            Self::Decorative => "decorative",
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OutlineGeneratedImageAsset {
    pub slide_reference: String,
    pub image_type: GeneratedImageType,
    pub ratio: String,
}

mod ratios;
pub use ratios::PRODUCT_IMAGE_RATIOS;
mod limits;
pub use limits::MAX_OUTLINE_GENERATED_IMAGES;

//! Managed, content-addressed images. Paths never come from clients or providers.
mod repository;
pub use repository::Repository;
use serde::{Deserialize, Serialize};

pub const MAX_IMAGE_BYTES: usize = 20 * 1024 * 1024;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectImage {
    pub asset_id: String,
    pub slide_reference: String,
    pub width: u32,
    pub height: u32,
    pub ratio: String,
    pub source: String,
    pub created_at: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageJob {
    pub request_id: String,
    pub kind: String,
    pub state: String,
    pub ratio: String,
    pub asset_id: Option<String>,
    pub error_code: String,
    pub created_at: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct GenerateInput {
    pub request_id: String,
    pub prompt: String,
    pub ratio: String,
    #[serde(default)]
    pub remove_background: bool,
}

pub struct AssetBytes {
    pub bytes: Vec<u8>,
    pub mime: String,
}

pub(crate) struct PreparedAsset {
    pub id: String,
    pub mime: String,
    pub byte_length: usize,
    pub width: u32,
    pub height: u32,
}

pub(crate) fn nearest_ratio(width: u32, height: u32) -> String {
    let value = width as f64 / height as f64;
    [
        ("1:1", 1.),
        ("4:3", 4. / 3.),
        ("3:4", 3. / 4.),
        ("4:5", 4. / 5.),
        ("16:9", 16. / 9.),
        ("9:16", 9. / 16.),
    ]
    .into_iter()
    .min_by(|a, b| {
        (a.1 / value)
            .ln()
            .abs()
            .total_cmp(&(b.1 / value).ln().abs())
    })
    .map(|entry| entry.0)
    .unwrap_or("1:1")
    .into()
}

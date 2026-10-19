use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};


#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(deny_unknown_fields)]
pub struct OutlineInput {
    #[serde(default)]
    pub title: String,
    #[serde(default, rename = "page_count", alias = "pageCount")]
    pub page_count: Option<i64>,
    #[serde(default)]
    pub body: Vec<OutlineSlideInput>,
    #[serde(default)]
    pub slides: Option<Vec<OutlineSlideV2>>,
}


#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(deny_unknown_fields)]
pub struct OutlineSlideInput {
    #[serde(default)]
    pub index: Option<i64>,
    #[serde(default)]
    pub page: Option<i64>,
    pub contents: Vec<String>,
}


#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct OutlineSlideV2 {
    pub page_number: i64,
    pub contents: Map<String, Value>,
}

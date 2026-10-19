use serde::Deserialize;
use std::{collections::BTreeMap, sync::LazyLock};

pub const JSON: &str = include_str!("../../../packages/model-catalog/providers.json");

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Provider {
    pub label: String,
    pub base_url: String,
    pub kinds: Vec<String>,
    pub text_max_tokens_field: String,
    pub image_default_count: Option<u32>,
}

pub static PROVIDERS: LazyLock<BTreeMap<String, Provider>> = LazyLock::new(|| {
    serde_json::from_str(JSON).expect("bundled provider catalog must be valid JSON")
});

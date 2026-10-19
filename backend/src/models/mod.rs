pub mod catalog;
mod repository;
mod validation;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

pub use repository::{Repository, ResolvedModel, StorageError};
pub use validation::ValidationError;

#[derive(Clone, Default, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct ModelOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_window: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub threshold_percentage: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_iterations: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_output_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning_effort: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_choice: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parallel_tool_calls: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connect_timeout_seconds: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub read_timeout_seconds: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_timeout_seconds: Option<u64>,
    #[serde(skip_serializing_if = "BTreeMap::is_empty")]
    pub extra_params: BTreeMap<String, Value>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EndpointInput {
    pub provider: String,
    pub base_url: String,
    pub model: String,
    /// Omission preserves the stored credential only while the endpoint is unchanged.
    pub api_key: Option<String>,
    #[serde(default)]
    pub options: ModelOptions,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EndpointView {
    pub provider: String,
    pub base_url: String,
    pub model: String,
    pub has_api_key: bool,
    pub options: ModelOptions,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SettingsInput {
    pub text: EndpointInput,
    pub image: EndpointInput,
}

#[derive(Serialize)]
pub struct SettingsView {
    pub text: EndpointView,
    pub image: EndpointView,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SaveSettings {
    pub revision: u64,
    pub settings: SettingsInput,
}

#[derive(Serialize)]
pub struct SettingsSnapshot {
    pub revision: u64,
    pub settings: SettingsView,
}

impl SaveSettings {
    pub fn validate(mut self) -> Result<Self, ValidationError> {
        if self.revision >= 9_007_199_254_740_991 {
            return Err(ValidationError::new("revision", "Invalid revision"));
        }
        validation::endpoint("text", &mut self.settings.text)?;
        validation::endpoint("image", &mut self.settings.image)?;
        Ok(self)
    }
}

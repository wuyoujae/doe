//! OpenAI-compatible request construction and bounded, cancellable transports.
pub mod images;
pub mod text;
pub(crate) mod agent_executor;

use crate::models::{ModelOptions, ResolvedModel};
use reqwest::{
    Client, Request,
    header::{AUTHORIZATION, HeaderValue},
};
use serde_json::{Map, Value, json};
use std::time::Duration;

pub struct AgentBudget {
    pub context_window: u32,
    pub threshold_percentage: f64,
    pub max_iterations: u32,
}

pub struct PreparedTextRequest {
    pub client: Client,
    pub request: Request,
    pub budget: AgentBudget,
}

pub struct PreparedImageRequest {
    pub client: Client,
    pub request: Request,
}

#[derive(Debug, thiserror::Error)]
pub enum AdapterError {
    #[error("Configure the model before making a request")]
    NotConfigured,
    #[error("Invalid request inputs")]
    InvalidInput,
    #[error("The configured HTTP client or request could not be constructed")]
    Request,
}

/// The caller owns tool execution, streaming response parsing, cancellation and run persistence.
/// Values match the audited otherone-agent contracts; no default sampling values are injected.
pub fn prepare_text(
    model: &ResolvedModel,
    messages: Vec<Value>,
    tools: Option<Vec<Value>>,
) -> Result<PreparedTextRequest, AdapterError> {
    if messages.is_empty() {
        return Err(AdapterError::InvalidInput);
    }
    let options = &model.endpoint.options;
    let mut body: Map<String, Value> = options.extra_params.clone().into_iter().collect();
    body.insert("model".into(), json!(model.endpoint.model));
    body.insert("messages".into(), json!(messages));
    if let Some(tools) = tools.filter(|tools| !tools.is_empty()) {
        body.insert("tools".into(), json!(tools));
    }
    if let Some(value) = options.temperature {
        body.insert("temperature".into(), json!(value));
    }
    if let Some(value) = options.top_p {
        body.insert("top_p".into(), json!(value));
    }
    if let Some(value) = options.max_output_tokens {
        let field = crate::models::catalog::PROVIDERS
            .get(&model.endpoint.provider)
            .ok_or(AdapterError::InvalidInput)?
            .text_max_tokens_field
            .as_str();
        body.insert(field.into(), json!(value));
    }
    if let Some(value) = &options.reasoning_effort {
        body.insert("reasoning_effort".into(), json!(value));
    }
    if let Some(value) = &options.tool_choice {
        body.insert("tool_choice".into(), json!(value));
    }
    if let Some(value) = options.parallel_tool_calls {
        body.insert("parallel_tool_calls".into(), json!(value));
    }
    // The Work UI streams by default; an explicit provider override may disable it.
    body.insert("stream".into(), json!(options.stream.unwrap_or(true)));
    let (client, request) = prepare(model, "chat/completions", Value::Object(body))?;
    Ok(PreparedTextRequest {
        client,
        request,
        budget: AgentBudget {
            context_window: options.context_window.unwrap_or(131_072),
            threshold_percentage: options.threshold_percentage.unwrap_or(0.8),
            max_iterations: options.max_iterations.unwrap_or(8),
        },
    })
}

pub fn prepare_image(
    model: &ResolvedModel,
    prompt: &str,
) -> Result<PreparedImageRequest, AdapterError> {
    if prompt.trim().is_empty() {
        return Err(AdapterError::InvalidInput);
    }
    let mut body: Map<String, Value> = model
        .endpoint
        .options
        .extra_params
        .clone()
        .into_iter()
        .collect();
    body.insert("model".into(), json!(model.endpoint.model));
    body.insert("prompt".into(), json!(prompt));
    if let Some(count) = crate::models::catalog::PROVIDERS
        .get(&model.endpoint.provider)
        .ok_or(AdapterError::InvalidInput)?
        .image_default_count
    {
        body.insert("n".into(), json!(count));
    }
    let (client, request) = prepare(model, "images/generations", Value::Object(body))?;
    Ok(PreparedImageRequest { client, request })
}

fn prepare(
    model: &ResolvedModel,
    resource: &str,
    body: Value,
) -> Result<(Client, Request), AdapterError> {
    if model.endpoint.base_url.is_empty() || model.endpoint.model.is_empty() {
        return Err(AdapterError::NotConfigured);
    }
    let client = client(&model.endpoint.options)?;
    let mut builder = client
        .post(format!("{}/{resource}", model.endpoint.base_url))
        .json(&body);
    if !model.api_key.is_empty() {
        let mut authorization =
            HeaderValue::from_str(&format!("Bearer {}", model.api_key.as_str()))
                .map_err(|_| AdapterError::Request)?;
        authorization.set_sensitive(true);
        builder = builder.header(AUTHORIZATION, authorization);
    }
    let request = builder.build().map_err(|_| AdapterError::Request)?;
    Ok((client, request))
}

fn client(options: &ModelOptions) -> Result<Client, AdapterError> {
    Client::builder()
        .connect_timeout(Duration::from_secs(
            options.connect_timeout_seconds.unwrap_or(15),
        ))
        .read_timeout(Duration::from_secs(
            options.read_timeout_seconds.unwrap_or(300),
        ))
        .timeout(Duration::from_secs(
            options.request_timeout_seconds.unwrap_or(900),
        ))
        // Credentials must not follow provider redirects to a different destination.
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| AdapterError::Request)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::EndpointView;
    use zeroize::Zeroizing;

    #[test]
    fn text_streams_by_default_and_preserves_an_explicit_opt_out() {
        for (configured, expected) in [(None, true), (Some(true), true), (Some(false), false)] {
            let model = ResolvedModel {
                endpoint: EndpointView {
                    provider: "custom".into(),
                    base_url: "https://example.com/v1".into(),
                    model: "text".into(),
                    has_api_key: false,
                    options: ModelOptions {
                        stream: configured,
                        ..ModelOptions::default()
                    },
                },
                api_key: Zeroizing::new(String::new()),
            };
            let prepared =
                prepare_text(&model, vec![json!({"role":"user","content":"test"})], None).unwrap();
            let body: Value =
                serde_json::from_slice(prepared.request.body().unwrap().as_bytes().unwrap())
                    .unwrap();
            assert_eq!(body["stream"], expected);
        }
    }

    #[test]
    fn output_limit_uses_the_provider_supported_field() {
        for (provider, expected, absent) in [
            ("openai", "max_completion_tokens", "max_tokens"),
            ("minimax", "max_completion_tokens", "max_tokens"),
            ("custom", "max_tokens", "max_completion_tokens"),
            ("anthropic", "max_tokens", "max_completion_tokens"),
        ] {
            let model = ResolvedModel {
                endpoint: EndpointView {
                    provider: provider.into(),
                    base_url: "https://example.com/v1".into(),
                    model: "test".into(),
                    has_api_key: false,
                    options: ModelOptions {
                        max_output_tokens: Some(1024),
                        ..ModelOptions::default()
                    },
                },
                api_key: Zeroizing::new(String::new()),
            };
            let request = prepare_text(&model, vec![json!({"role":"user","content":"test"})], None)
                .expect("valid prepared request")
                .request;
            let body: Value = serde_json::from_slice(
                request.body().expect("body").as_bytes().expect("JSON body"),
            )
            .expect("valid JSON");
            assert_eq!(body[expected], 1024);
            assert!(body.get(absent).is_none());
        }
    }

    #[test]
    fn image_count_is_only_sent_when_the_provider_accepts_it() {
        for (provider, expects_count) in [
            ("openai", true),
            ("custom", true),
            ("zai", false),
            ("volcengine", false),
            ("gemini", true),
        ] {
            let model = ResolvedModel {
                endpoint: EndpointView {
                    provider: provider.into(),
                    base_url: "https://example.com/v1".into(),
                    model: "image".into(),
                    has_api_key: false,
                    options: ModelOptions::default(),
                },
                api_key: Zeroizing::new(String::new()),
            };
            let request = prepare_image(&model, "An illustration")
                .expect("request")
                .request;
            let body: Value = serde_json::from_slice(
                request.body().expect("body").as_bytes().expect("JSON body"),
            )
            .expect("JSON");
            assert_eq!(body.get("n").is_some(), expects_count);
        }
    }
}

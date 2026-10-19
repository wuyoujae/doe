use super::{EndpointInput, ModelOptions};
use url::Url;

#[derive(Debug, thiserror::Error)]
#[error("{message}")]
pub struct ValidationError {
    pub field: String,
    pub message: &'static str,
}

impl ValidationError {
    pub fn new(field: impl Into<String>, message: &'static str) -> Self {
        Self {
            field: field.into(),
            message,
        }
    }
}

pub(super) fn endpoint(kind: &str, endpoint: &mut EndpointInput) -> Result<(), ValidationError> {
    let invalid = |field: &str, message| ValidationError::new(format!("{kind}.{field}"), message);
    let provider = super::catalog::PROVIDERS
        .get(&endpoint.provider)
        .filter(|provider| provider.kinds.iter().any(|supported| supported == kind))
        .ok_or_else(|| invalid("provider", "Unsupported provider for this model type"))?;
    let preset_url = (endpoint.provider != "custom").then_some(provider.base_url.as_str());
    endpoint.base_url = endpoint.base_url.trim().trim_end_matches('/').to_owned();
    endpoint.model = endpoint.model.trim().to_owned();
    if endpoint.model.chars().count() > 256 || endpoint.model.chars().any(char::is_control) {
        return Err(invalid(
            "model",
            "Model ID must contain at most 256 non-control characters",
        ));
    }
    if let Some(key) = &mut endpoint.api_key {
        *key = key.trim().to_owned();
        if key.len() > 8192 || key.chars().any(char::is_control) {
            return Err(invalid("apiKey", "Invalid API key"));
        }
    }
    if let Some(url) = preset_url {
        if endpoint.base_url != url {
            return Err(invalid(
                "baseUrl",
                "Preset provider requires its official endpoint",
            ));
        }
    }
    if endpoint.base_url.is_empty() && endpoint.model.is_empty() {
        if endpoint.api_key.as_ref().is_some_and(|key| !key.is_empty()) {
            return Err(invalid(
                "baseUrl",
                "Configure an endpoint and model before saving a key",
            ));
        }
    } else {
        if endpoint.base_url.is_empty() || endpoint.base_url.len() > 2048 {
            return Err(invalid("baseUrl", "A valid base URL is required"));
        }
        let url = Url::parse(&endpoint.base_url)
            .map_err(|_| invalid("baseUrl", "Enter an absolute HTTP(S) base URL"))?;
        if !matches!(url.scheme(), "http" | "https")
            || url.host_str().is_none()
            || !url.username().is_empty()
            || url.password().is_some()
            || url.query().is_some()
            || url.fragment().is_some()
            || endpoint.base_url.chars().any(char::is_whitespace)
        {
            return Err(invalid(
                "baseUrl",
                "Base URL cannot contain credentials, queries, fragments or whitespace",
            ));
        }
        endpoint.base_url = url.to_string().trim_end_matches('/').to_owned();
        if endpoint.base_url.len() > 2048 {
            return Err(invalid("baseUrl", "The normalized base URL is too long"));
        }
        if endpoint.model.is_empty() {
            return Err(invalid("model", "A model ID is required"));
        }
    }
    options(kind, &endpoint.provider, &endpoint.options)
}

fn options(kind: &str, provider: &str, options: &ModelOptions) -> Result<(), ValidationError> {
    let invalid =
        |field: &str, message| ValidationError::new(format!("{kind}.options.{field}"), message);
    let range = |field: &str, value: Option<f64>, min: f64, max: f64| {
        if value.is_some_and(|number| !number.is_finite() || number < min || number > max) {
            Err(invalid(field, "Value is outside the supported range"))
        } else {
            Ok(())
        }
    };
    range(
        "contextWindow",
        options.context_window.map(f64::from),
        1024.0,
        1_000_000.0,
    )?;
    range(
        "thresholdPercentage",
        options.threshold_percentage,
        0.1,
        0.98,
    )?;
    range(
        "maxIterations",
        options.max_iterations.map(f64::from),
        1.0,
        128.0,
    )?;
    range("temperature", options.temperature, 0.0, 2.0)?;
    range("topP", options.top_p, 0.0, 1.0)?;
    range(
        "maxOutputTokens",
        options.max_output_tokens.map(f64::from),
        1.0,
        1_000_000.0,
    )?;
    range(
        "connectTimeoutSeconds",
        options.connect_timeout_seconds.map(|n| n as f64),
        1.0,
        120.0,
    )?;
    range(
        "readTimeoutSeconds",
        options.read_timeout_seconds.map(|n| n as f64),
        30.0,
        3600.0,
    )?;
    range(
        "requestTimeoutSeconds",
        options.request_timeout_seconds.map(|n| n as f64),
        60.0,
        7200.0,
    )?;
    let connect = options.connect_timeout_seconds.unwrap_or(15);
    let read = options.read_timeout_seconds.unwrap_or(300);
    let request = options.request_timeout_seconds.unwrap_or(900);
    if connect > request || read > request {
        return Err(invalid(
            "requestTimeoutSeconds",
            "Request timeout must cover the effective connect and read timeouts",
        ));
    }
    if let Some(effort) = options.reasoning_effort.as_deref() {
        if !matches!(
            effort,
            "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max"
        ) {
            return Err(invalid("reasoningEffort", "Unsupported reasoning effort"));
        }
        if provider == "anthropic"
            || (provider == "deepseek" && !matches!(effort, "none" | "low" | "high" | "max"))
        {
            return Err(invalid(
                "reasoningEffort",
                "This provider does not support the selected reasoning effort",
            ));
        }
    }
    if options
        .tool_choice
        .as_deref()
        .is_some_and(|choice| !matches!(choice, "auto" | "none" | "required"))
    {
        return Err(invalid("toolChoice", "Unsupported tool choice"));
    }
    if kind == "image"
        && (options.context_window.is_some()
            || options.threshold_percentage.is_some()
            || options.max_iterations.is_some()
            || options.temperature.is_some()
            || options.top_p.is_some()
            || options.max_output_tokens.is_some()
            || options.reasoning_effort.is_some()
            || options.tool_choice.is_some()
            || options.parallel_tool_calls.is_some()
            || options.stream.is_some())
    {
        return Err(invalid(
            "contextWindow",
            "Text-agent options cannot be used with image models",
        ));
    }
    const RESERVED: &[&str] = &[
        "model",
        "messages",
        "prompt",
        "n",
        "stream",
        "stream_options",
        "tools",
        "api_key",
        "apiKey",
        "base_url",
        "baseUrl",
        "temperature",
        "top_p",
        "max_tokens",
        "max_completion_tokens",
        "max_output_tokens",
        "reasoning_effort",
        "tool_choice",
        "parallel_tool_calls",
        "contextWindow",
        "thresholdPercentage",
        "maxIterations",
        "topP",
        "maxOutputTokens",
        "reasoningEffort",
        "toolChoice",
        "parallelToolCalls",
        "connectTimeoutSeconds",
        "readTimeoutSeconds",
        "requestTimeoutSeconds",
        "headers",
        "authorization",
    ];
    if options.extra_params.keys().any(|key| {
        key.len() > 128 || key.chars().any(char::is_control) || RESERVED.contains(&key.as_str())
    }) {
        return Err(invalid(
            "extraParams",
            "Extra parameters cannot override credentials, request inputs, or typed settings",
        ));
    }
    if options.extra_params.len() > 128
        || serde_json::to_vec(&options.extra_params).map_or(true, |json| json.len() > 16_384)
    {
        return Err(invalid(
            "extraParams",
            "Extra parameters exceed the supported size",
        ));
    }
    Ok(())
}

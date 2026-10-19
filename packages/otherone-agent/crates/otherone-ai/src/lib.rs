// 作用：otherone-ai 模块入口 — 统一导出 AI 提供商相关类型和方法
// 关联：被 otherone-agent 和 otherone-context 调用
// 预期结果：提供 invoke_model 入口，按 provider 类型分发到对应客户端

pub mod error;
pub mod http_transport;
pub mod traits;
pub mod types;

pub mod anthropic;
pub mod fetch;
pub mod local;
pub mod openai;
pub mod openrouter;

use error::AiError;
use http_transport::RequestTimeouts;
use traits::AiProvider;
use types::{ChatRequest, ChatResponse, ProviderType};

/// 从 OpenAI 风格的 config JSON 构建 ChatRequest
/// OpenRouter 和 Local provider 都使用与 OpenAI 兼容的格式
fn build_openai_style_request(options: &openai::types::ConfigOptions) -> ChatRequest {
    let mut extra = options.extra.clone();
    if let Some(legacy_reasoning_effort) = extra.remove("reasoningEffort") {
        extra
            .entry("reasoning_effort".to_string())
            .or_insert(legacy_reasoning_effort);
    }
    if let Some(parallel_tool_calls) = options.parallel_tool_calls {
        extra.insert(
            "parallel_tool_calls".to_string(),
            serde_json::Value::Bool(parallel_tool_calls),
        );
    }
    if let Some(provider) = options.provider.as_ref() {
        extra.insert("provider".to_string(), provider.clone());
    }
    ChatRequest {
        model: options.model.clone(),
        messages: options.messages.clone(),
        max_tokens: options.max_tokens,
        temperature: options.temperature,
        top_p: options.top_p,
        tools: options.tools.clone(),
        tool_choice: options.tool_choice.clone(),
        stream: options.stream,
        extra: if extra.is_empty() { None } else { Some(extra) },
    }
}

/// 调用 AI 模型（非流式）
pub async fn invoke_model(
    provider: ProviderType,
    api_key: &str,
    base_url: &str,
    config: serde_json::Value,
) -> Result<ChatResponse, AiError> {
    if api_key.is_empty() {
        return Err(AiError::ConfigError("api_key is required".to_string()));
    }
    if base_url.is_empty() {
        return Err(AiError::ConfigError("base_url is required".to_string()));
    }
    let timeouts = RequestTimeouts::from_config(&config)?;

    match provider {
        ProviderType::OpenAI => {
            let options: openai::types::ConfigOptions = serde_json::from_value(config)
                .map_err(|e| AiError::ConfigError(format!("Invalid OpenAI config: {}", e)))?;
            let request = build_openai_style_request(&options);
            let client = openai::client::OpenAiClient::try_new_with_timeouts(
                api_key.to_string(),
                base_url.to_string(),
                timeouts,
            )?;
            client.chat(request).await
        }
        ProviderType::OpenRouter => {
            let options: openai::types::ConfigOptions = serde_json::from_value(config)
                .map_err(|e| AiError::ConfigError(format!("Invalid OpenRouter config: {}", e)))?;
            let request = build_openai_style_request(&options);
            let client = openrouter::client::OpenRouterClient::try_new_with_timeouts(
                api_key.to_string(),
                base_url.to_string(),
                timeouts,
            )?;
            client.chat(request).await
        }
        ProviderType::Local => {
            let options: openai::types::ConfigOptions = serde_json::from_value(config)
                .map_err(|e| AiError::ConfigError(format!("Invalid Local config: {}", e)))?;
            let request = build_openai_style_request(&options);
            let client = local::client::LocalClient::try_new_with_timeouts(
                api_key.to_string(),
                base_url.to_string(),
                timeouts,
            )?;
            client.chat(request).await
        }
        ProviderType::Anthropic => {
            let options: anthropic::types::ConfigOptions = serde_json::from_value(config)
                .map_err(|e| AiError::ConfigError(format!("Invalid Anthropic config: {}", e)))?;
            let request = ChatRequest {
                model: options.model,
                messages: options.messages,
                max_tokens: options.max_tokens.or(Some(4096)),
                temperature: options.temperature,
                top_p: options.top_p,
                tools: options.tools,
                tool_choice: None,
                stream: options.stream,
                extra: None,
            };
            let client = anthropic::client::AnthropicClient::try_new_with_timeouts(
                api_key.to_string(),
                base_url.to_string(),
                timeouts,
            )?;
            client.chat(request).await
        }
        ProviderType::Fetch => {
            let request: ChatRequest = serde_json::from_value(config)
                .map_err(|e| AiError::ConfigError(format!("Invalid Fetch config: {}", e)))?;
            let client = fetch::client::FetchClient::try_new_with_timeouts(
                api_key.to_string(),
                base_url.to_string(),
                timeouts,
            )?;
            client.chat(request).await
        }
    }
}

/// 调用 AI 模型的流式版本
pub async fn invoke_model_stream(
    provider: ProviderType,
    api_key: &str,
    base_url: &str,
    config: serde_json::Value,
) -> Result<traits::ChatStream, AiError> {
    if api_key.is_empty() {
        return Err(AiError::ConfigError("api_key is required".to_string()));
    }
    if base_url.is_empty() {
        return Err(AiError::ConfigError("base_url is required".to_string()));
    }
    let timeouts = RequestTimeouts::from_config(&config)?;

    match provider {
        ProviderType::OpenAI => {
            let options: openai::types::ConfigOptions = serde_json::from_value(config)
                .map_err(|e| AiError::ConfigError(format!("Invalid OpenAI config: {}", e)))?;
            let mut request = build_openai_style_request(&options);
            request.stream = Some(true);
            let client = openai::client::OpenAiClient::try_new_with_timeouts(
                api_key.to_string(),
                base_url.to_string(),
                timeouts,
            )?;
            client.chat_stream(request).await
        }
        ProviderType::OpenRouter => {
            let options: openai::types::ConfigOptions = serde_json::from_value(config)
                .map_err(|e| AiError::ConfigError(format!("Invalid OpenRouter config: {}", e)))?;
            let mut request = build_openai_style_request(&options);
            request.stream = Some(true);
            let client = openrouter::client::OpenRouterClient::try_new_with_timeouts(
                api_key.to_string(),
                base_url.to_string(),
                timeouts,
            )?;
            client.chat_stream(request).await
        }
        ProviderType::Local => {
            let options: openai::types::ConfigOptions = serde_json::from_value(config)
                .map_err(|e| AiError::ConfigError(format!("Invalid Local config: {}", e)))?;
            let mut request = build_openai_style_request(&options);
            request.stream = Some(true);
            let client = local::client::LocalClient::try_new_with_timeouts(
                api_key.to_string(),
                base_url.to_string(),
                timeouts,
            )?;
            client.chat_stream(request).await
        }
        ProviderType::Anthropic => {
            let options: anthropic::types::ConfigOptions = serde_json::from_value(config)
                .map_err(|e| AiError::ConfigError(format!("Invalid Anthropic config: {}", e)))?;
            let request = ChatRequest {
                model: options.model,
                messages: options.messages,
                max_tokens: options.max_tokens.or(Some(4096)),
                temperature: options.temperature,
                top_p: options.top_p,
                tools: options.tools,
                tool_choice: None,
                stream: Some(true),
                extra: None,
            };
            let client = anthropic::client::AnthropicClient::try_new_with_timeouts(
                api_key.to_string(),
                base_url.to_string(),
                timeouts,
            )?;
            client.chat_stream(request).await
        }
        ProviderType::Fetch => {
            let request: ChatRequest = serde_json::from_value(config)
                .map_err(|e| AiError::ConfigError(format!("Invalid Fetch config: {}", e)))?;
            let client = fetch::client::FetchClient::try_new_with_timeouts(
                api_key.to_string(),
                base_url.to_string(),
                timeouts,
            )?;
            client.chat_stream(request).await
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_invoke_model_empty_api_key() {
        let result = invoke_model(
            ProviderType::OpenAI,
            "",
            "https://api.openai.com/v1",
            serde_json::json!({}),
        )
        .await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_invoke_model_empty_base_url() {
        let result =
            invoke_model(ProviderType::OpenAI, "test-key", "", serde_json::json!({})).await;
        assert!(result.is_err());
    }

    #[test]
    fn openai_style_request_preserves_extra_chat_params() {
        let options: openai::types::ConfigOptions = serde_json::from_value(serde_json::json!({
            "model": "deepseek-v4-flash",
            "messages": [],
            "reasoning_effort": "low",
            "reasoningEffort": "high",
            "parallelToolCalls": false,
            "max_tokens": 16,
            "connectTimeoutSeconds": 12,
            "readTimeoutSeconds": 240,
            "requestTimeoutSeconds": 1200
        }))
        .unwrap();

        let request = build_openai_style_request(&options);
        assert_eq!(request.max_tokens, Some(16));
        assert!(request
            .extra
            .as_ref()
            .unwrap()
            .get("connectTimeoutSeconds")
            .is_none());
        assert_eq!(
            request.extra.as_ref().unwrap()["reasoning_effort"],
            serde_json::json!("low")
        );
        assert!(request
            .extra
            .as_ref()
            .unwrap()
            .get("reasoningEffort")
            .is_none());
        assert_eq!(
            request.extra.as_ref().unwrap()["parallel_tool_calls"],
            serde_json::json!(false)
        );
    }

    #[test]
    fn openai_style_request_does_not_use_context_capacity_as_output_limit() {
        let options: openai::types::ConfigOptions = serde_json::from_value(serde_json::json!({
            "model": "google/gemini-3-flash-preview",
            "messages": [],
            "context_length": 1_000_000
        }))
        .unwrap();

        let request = build_openai_style_request(&options);
        assert_eq!(request.max_tokens, None);
    }

    #[test]
    fn openai_style_request_maps_configured_camel_case_output_limit_to_wire_field() {
        let options: openai::types::ConfigOptions = serde_json::from_value(serde_json::json!({
            "model": "deepseek/deepseek-v4-flash-0731",
            "messages": [],
            "maxTokens": 65_536
        }))
        .unwrap();

        let request = build_openai_style_request(&options);
        assert_eq!(request.max_tokens, Some(65_536));
        assert!(request.extra.as_ref().is_none_or(|extra| {
            !extra.contains_key("maxTokens") && !extra.contains_key("max_tokens")
        }));
    }

    #[test]
    fn openai_style_request_preserves_openrouter_provider_object() {
        let options: openai::types::ConfigOptions = serde_json::from_value(serde_json::json!({
            "model": "google/gemini-3.1-pro-preview",
            "messages": [],
            "provider": {
                "require_parameters": true,
                "order": ["Google"]
            },
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "deck", "strict": true, "schema": {"type": "object"}}
            }
        }))
        .unwrap();

        let request = build_openai_style_request(&options);
        let extra = request.extra.expect("wire extras");
        assert_eq!(extra["provider"]["require_parameters"], true);
        assert_eq!(extra["provider"]["order"], serde_json::json!(["Google"]));
        assert_eq!(extra["response_format"]["type"], "json_schema");
    }

    #[tokio::test]
    #[ignore]
    async fn live_openai_compatible_stream_returns_first_delta_chunk() {
        use futures::StreamExt;

        let api_key = std::env::var("OTHERONE_LIVE_API_KEY")
            .expect("OTHERONE_LIVE_API_KEY is required for live stream test");
        let base_url = std::env::var("OTHERONE_LIVE_BASE_URL")
            .unwrap_or_else(|_| "https://api.deepseek.com/v1".to_string());
        let model = std::env::var("OTHERONE_LIVE_MODEL")
            .unwrap_or_else(|_| "deepseek-v4-flash".to_string());

        let mut stream = invoke_model_stream(
            ProviderType::OpenAI,
            &api_key,
            &base_url,
            serde_json::json!({
                "model": model,
                "messages": [
                    { "role": "user", "content": "Reply with only OK." }
                ],
                "max_tokens": 16,
                "stream": true
            }),
        )
        .await
        .unwrap();

        let first_delta = tokio::time::timeout(std::time::Duration::from_secs(30), async {
            while let Some(chunk) = stream.next().await {
                let chunk = chunk.unwrap();
                if let Some(delta_text) = chunk
                    .choices
                    .first()
                    .and_then(|choice| choice.delta.as_ref())
                    .and_then(|delta| {
                        delta
                            .content
                            .as_deref()
                            .or(delta.reasoning_content.as_deref())
                    })
                    .filter(|content| !content.is_empty())
                {
                    return Some(delta_text.to_string());
                }
            }
            None
        })
        .await
        .unwrap();

        assert!(first_delta.is_some());
    }
}

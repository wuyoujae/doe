// 作用：OpenRouter HTTP 客户端 — 实现 AiProvider trait
// 关联：OpenRouter 的 API 与 OpenAI 兼容，使用相同格式但有特定 headers
// 预期结果：通过 reqwest 发送请求到 OpenRouter API

use async_trait::async_trait;
use futures::StreamExt;
use reqwest::Client as HttpClient;

use crate::error::AiError;
use crate::http_transport::{send_external_ai_request, RequestTimeouts};
use crate::traits::{AiProvider, ChatStream};
use crate::types::{ChatRequest, ChatResponse, ProviderType};

/// OpenRouter HTTP 客户端
/// OpenRouter API 与 OpenAI 兼容，但需要特定的 HTTP headers
pub struct OpenRouterClient {
    http_client: HttpClient,
    api_key: String,
    base_url: String,
}

impl OpenRouterClient {
    /// 创建新的 OpenRouter 客户端
    pub fn new(api_key: String, base_url: String) -> Self {
        Self::try_new(api_key, base_url).expect("Failed to create OpenRouter HTTP client")
    }

    pub fn try_new(api_key: String, base_url: String) -> Result<Self, AiError> {
        Self::try_new_with_timeouts(api_key, base_url, RequestTimeouts::default())
    }

    pub fn try_new_with_timeouts(
        api_key: String,
        base_url: String,
        timeouts: RequestTimeouts,
    ) -> Result<Self, AiError> {
        let http_client = crate::http_transport::external_ai_client(timeouts)?;

        let base_url = base_url.trim_end_matches('/').to_string();

        Ok(OpenRouterClient {
            http_client,
            api_key,
            base_url,
        })
    }
}

#[async_trait]
impl AiProvider for OpenRouterClient {
    /// 非流式聊天请求
    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse, AiError> {
        let url = format!("{}/chat/completions", self.base_url);

        let mut body = serde_json::json!({
            "model": request.model,
            "messages": request.messages,
        });

        if let Some(max_tokens) = request.max_tokens {
            body["max_tokens"] = serde_json::json!(max_tokens);
        }
        if let Some(temperature) = request.temperature {
            body["temperature"] = serde_json::json!(temperature);
        }
        if let Some(top_p) = request.top_p {
            body["top_p"] = serde_json::json!(top_p);
        }
        if let Some(ref tools) = request.tools {
            body["tools"] = serde_json::to_value(tools).unwrap();
        }
        if let Some(ref tool_choice) = request.tool_choice {
            body["tool_choice"] = serde_json::to_value(tool_choice).unwrap();
        }
        if let Some(stream) = request.stream {
            body["stream"] = serde_json::json!(stream);
        }
        if let Some(ref extra) = request.extra {
            for (key, value) in extra {
                body[key] = value.clone();
            }
        }

        // OpenRouter 特有 headers
        let response = send_external_ai_request(
            self.http_client
                .post(&url)
                .header("Authorization", format!("Bearer {}", self.api_key))
                .header("Content-Type", "application/json")
                .header("HTTP-Referer", "https://github.com/otherone-agent")
                .header("X-Title", "otherone-agent")
                .json(&body),
        )
        .await?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AiError::ApiError {
                status: status.as_u16(),
                message: error_text,
            });
        }

        let chat_response: ChatResponse = response.json().await?;
        Ok(chat_response)
    }

    /// 流式聊天请求
    async fn chat_stream(&self, request: ChatRequest) -> Result<ChatStream, AiError> {
        let url = format!("{}/chat/completions", self.base_url);

        let mut body = serde_json::json!({
            "model": request.model,
            "messages": request.messages,
            "stream": true,
        });

        if let Some(max_tokens) = request.max_tokens {
            body["max_tokens"] = serde_json::json!(max_tokens);
        }
        if let Some(temperature) = request.temperature {
            body["temperature"] = serde_json::json!(temperature);
        }
        if let Some(top_p) = request.top_p {
            body["top_p"] = serde_json::json!(top_p);
        }
        if let Some(ref tools) = request.tools {
            body["tools"] = serde_json::to_value(tools).unwrap();
        }
        if let Some(ref tool_choice) = request.tool_choice {
            body["tool_choice"] = serde_json::to_value(tool_choice).unwrap();
        }
        if let Some(ref extra) = request.extra {
            for (key, value) in extra {
                body[key] = value.clone();
            }
        }

        let response = send_external_ai_request(
            self.http_client
                .post(&url)
                .header("Authorization", format!("Bearer {}", self.api_key))
                .header("Content-Type", "application/json")
                .header("HTTP-Referer", "https://github.com/otherone-agent")
                .header("X-Title", "otherone-agent")
                .json(&body),
        )
        .await?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AiError::ApiError {
                status: status.as_u16(),
                message: error_text,
            });
        }

        let byte_stream = response.bytes_stream();
        let stream = byte_stream.flat_map(|result| {
            let items = match result {
                Ok(b) => {
                    let text = String::from_utf8_lossy(&b);
                    let mut items = Vec::new();
                    for line in text.lines() {
                        let line = line.trim();
                        if line.is_empty() || line == "data: [DONE]" {
                            continue;
                        }
                        if let Some(json_str) = line.strip_prefix("data: ") {
                            if let Ok(chunk) = serde_json::from_str::<ChatResponse>(json_str) {
                                items.push(Ok(chunk));
                            }
                        }
                    }
                    items
                }
                Err(e) => vec![Err(AiError::HttpError(e))],
            };
            futures::stream::iter(items)
        });

        Ok(Box::pin(stream))
    }

    fn provider_type(&self) -> ProviderType {
        ProviderType::OpenRouter
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_url_no_trailing_slash() {
        let client = OpenRouterClient::new(
            "test-key".to_string(),
            "https://openrouter.ai/api/v1/".to_string(),
        );
        assert_eq!(client.base_url, "https://openrouter.ai/api/v1");
    }
}

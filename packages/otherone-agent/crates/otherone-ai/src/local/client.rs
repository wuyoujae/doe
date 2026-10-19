// 作用：本地模型 HTTP 客户端 — 实现 AiProvider trait
// 关联：支持 Ollama、vLLM 等本地部署模型的 OpenAI 兼容 API
// 预期结果：通过 reqwest 发送请求到本地模型服务

use async_trait::async_trait;
use futures::StreamExt;
use reqwest::Client as HttpClient;

use crate::error::AiError;
use crate::http_transport::RequestTimeouts;
use crate::traits::{AiProvider, ChatStream};
use crate::types::{ChatRequest, ChatResponse, ProviderType};

/// 本地模型 HTTP 客户端
/// 兼容 Ollama、vLLM、LocalAI 等本地模型服务
pub struct LocalClient {
    http_client: HttpClient,
    api_key: String,
    base_url: String,
}

impl LocalClient {
    /// 创建新的本地模型客户端
    /// 对于 Ollama，base_url 通常为 http://localhost:11434/v1
    /// 对于 vLLM，base_url 通常为 http://localhost:8000/v1
    pub fn new(api_key: String, base_url: String) -> Self {
        Self::try_new(api_key, base_url).expect("Failed to create Local AI HTTP client")
    }

    pub fn try_new(api_key: String, base_url: String) -> Result<Self, AiError> {
        Self::try_new_with_timeouts(api_key, base_url, RequestTimeouts::default())
    }

    pub fn try_new_with_timeouts(
        api_key: String,
        base_url: String,
        timeouts: RequestTimeouts,
    ) -> Result<Self, AiError> {
        let http_client = timeouts
            .apply(crate::http_transport::direct_ai_client_builder())
            .build()?;

        let base_url = base_url.trim_end_matches('/').to_string();

        Ok(LocalClient {
            http_client,
            api_key,
            base_url,
        })
    }
}

#[async_trait]
impl AiProvider for LocalClient {
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

        let mut req = self
            .http_client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&body);

        // 本地模型可以不传 API key，但有些服务需要
        if !self.api_key.is_empty() && self.api_key != "ollama" && self.api_key != "not-needed" {
            req = req.header("Authorization", format!("Bearer {}", self.api_key));
        }

        let response = req.send().await?;

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

        let mut req = self
            .http_client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&body);

        if !self.api_key.is_empty() && self.api_key != "ollama" && self.api_key != "not-needed" {
            req = req.header("Authorization", format!("Bearer {}", self.api_key));
        }

        let response = req.send().await?;

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
        ProviderType::Local
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_url_no_trailing_slash() {
        let client = LocalClient::new(
            "ollama".to_string(),
            "http://localhost:11434/v1/".to_string(),
        );
        assert_eq!(client.base_url, "http://localhost:11434/v1");
    }
}

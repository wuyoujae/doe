// 作用：Anthropic HTTP 客户端 — 实现 AiProvider trait
// 关联：被 otherone-ai/lib.rs 的 invoke_model 入口调用
// 预期结果：通过 reqwest 发送 HTTP 请求到 Anthropic Messages API

use async_trait::async_trait;
use futures::StreamExt;
use reqwest::Client as HttpClient;

use crate::error::AiError;
use crate::http_transport::{send_external_ai_request, RequestTimeouts};
use crate::traits::{AiProvider, ChatStream};
use crate::types::{ChatRequest, ChatResponse, ProviderType};

/// Anthropic HTTP 客户端
pub struct AnthropicClient {
    http_client: HttpClient,
    api_key: String,
    base_url: String,
    api_version: String,
}

impl AnthropicClient {
    /// 创建新的 Anthropic 客户端
    pub fn new(api_key: String, base_url: String) -> Self {
        Self::try_new(api_key, base_url).expect("Failed to create Anthropic HTTP client")
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

        Ok(AnthropicClient {
            http_client,
            api_key,
            base_url,
            api_version: "2023-06-01".to_string(),
        })
    }
}

#[async_trait]
impl AiProvider for AnthropicClient {
    /// 非流式聊天请求
    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse, AiError> {
        let url = format!("{}/messages", self.base_url);

        // 提取 system 消息（Anthropic 的 system 在顶层）
        let system_content = extract_system_messages(&request.messages);
        let non_system_messages: Vec<_> = request
            .messages
            .iter()
            .filter(|m| m.role != "system")
            .cloned()
            .collect();

        let mut body = serde_json::json!({
            "model": request.model,
            "max_tokens": request.max_tokens.unwrap_or(4096),
            "messages": non_system_messages,
        });

        if let Some(ref sys) = system_content {
            body["system"] = serde_json::json!(sys);
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

        let response = send_external_ai_request(
            self.http_client
                .post(&url)
                .header("x-api-key", &self.api_key)
                .header("anthropic-version", &self.api_version)
                .header("Content-Type", "application/json")
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

        let anthropic_response: serde_json::Value = response.json().await?;
        let chat_response = Self::convert_anthropic_to_chat_response(&anthropic_response)?;
        Ok(chat_response)
    }

    /// 流式聊天请求
    async fn chat_stream(&self, request: ChatRequest) -> Result<ChatStream, AiError> {
        let url = format!("{}/messages", self.base_url);

        // 提取 system 消息
        let system_content = extract_system_messages(&request.messages);
        let non_system_messages: Vec<_> = request
            .messages
            .iter()
            .filter(|m| m.role != "system")
            .cloned()
            .collect();

        let mut body = serde_json::json!({
            "model": request.model,
            "max_tokens": request.max_tokens.unwrap_or(4096),
            "messages": non_system_messages,
            "stream": true,
        });

        if let Some(ref sys) = system_content {
            body["system"] = serde_json::json!(sys);
        }

        let response = send_external_ai_request(
            self.http_client
                .post(&url)
                .header("x-api-key", &self.api_key)
                .header("anthropic-version", &self.api_version)
                .header("Content-Type", "application/json")
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
                        if line.is_empty() {
                            continue;
                        }
                        if let Some(json_str) = line.strip_prefix("data: ") {
                            if let Ok(chunk) =
                                Self::convert_anthropic_event_to_chat_response(json_str)
                            {
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
        ProviderType::Anthropic
    }
}

impl AnthropicClient {
    /// 将 Anthropic 非流式响应转换为统一的 ChatResponse
    fn convert_anthropic_to_chat_response(
        response: &serde_json::Value,
    ) -> Result<ChatResponse, AiError> {
        let content = response["content"]
            .as_array()
            .and_then(|arr| {
                arr.iter()
                    .filter(|c| c["type"] == "text")
                    .map(|c| c["text"].as_str().unwrap_or(""))
                    .collect::<Vec<_>>()
                    .first()
                    .map(|s| s.to_string())
            })
            .unwrap_or_default();

        // 提取 tool_use 内容块并转换为 OpenAI 格式的 tool_calls
        let tool_calls = extract_anthropic_tool_uses(response);

        let usage = &response["usage"];
        let total_tokens = usage["input_tokens"].as_u64().unwrap_or(0)
            + usage["output_tokens"].as_u64().unwrap_or(0);

        Ok(ChatResponse {
            id: response["id"].as_str().map(|s| s.to_string()),
            object: Some("chat.completion".to_string()),
            created: None,
            model: response["model"].as_str().map(|s| s.to_string()),
            choices: vec![crate::types::Choice {
                index: 0,
                message: Some(crate::types::ResponseMessage {
                    role: Some("assistant".to_string()),
                    content: Some(content),
                    reasoning_content: None,
                    reasoning: None,
                    thinking: None,
                    thought: None,
                    reasoning_details: None,
                    tool_calls,
                }),
                delta: None,
                finish_reason: Some(
                    response["stop_reason"]
                        .as_str()
                        .unwrap_or("stop")
                        .to_string(),
                ),
            }],
            usage: Some(crate::types::Usage {
                details: Default::default(),
                prompt_tokens: Some(usage["input_tokens"].as_u64().unwrap_or(0) as u32),
                completion_tokens: Some(usage["output_tokens"].as_u64().unwrap_or(0) as u32),
                total_tokens: Some(total_tokens as u32),
                cost: None,
            }),
        })
    }

    /// 将 Anthropic SSE 事件转换为统一的 ChatResponse
    fn convert_anthropic_event_to_chat_response(json_str: &str) -> Result<ChatResponse, AiError> {
        let event: serde_json::Value = serde_json::from_str(json_str)?;

        let event_type = event["type"].as_str().unwrap_or("");
        let usage = extract_anthropic_stream_usage(&event);

        // Handle tool_use blocks in streaming
        if event_type == "content_block_start" || event_type == "content_block_delta" {
            let block_type = event["content_block"]["type"]
                .as_str()
                .or_else(|| event.get("delta").and_then(|d| d["type"].as_str()))
                .unwrap_or("");

            if block_type == "tool_use" || block_type == "input_json_delta" {
                // Extract tool_use info
                let tool_name = event["content_block"]["name"].as_str().unwrap_or("");
                let tool_id = event["content_block"]["id"].as_str().unwrap_or("");
                let partial_json = event["delta"]["partial_json"].as_str().unwrap_or("");
                let index = event["index"]
                    .as_u64()
                    .and_then(|value| u32::try_from(value).ok());

                // Build tool_call delta
                let tool_calls = if !tool_name.is_empty() || !partial_json.is_empty() {
                    Some(vec![crate::types::ToolCall {
                        index,
                        id: tool_id.to_string(),
                        call_type: "function".to_string(),
                        function: crate::types::FunctionCall {
                            name: tool_name.to_string(),
                            arguments: partial_json.to_string(),
                        },
                    }])
                } else {
                    None
                };

                return Ok(ChatResponse {
                    id: None,
                    object: Some("chat.completion.chunk".to_string()),
                    created: None,
                    model: None,
                    choices: vec![crate::types::Choice {
                        index: 0,
                        message: None,
                        delta: Some(crate::types::ResponseDelta {
                            role: None,
                            content: Some("".to_string()),
                            reasoning_content: None,
                            reasoning: None,
                            thinking: None,
                            thought: None,
                            reasoning_details: None,
                            tool_calls,
                        }),
                        finish_reason: None,
                    }],
                    usage: None,
                });
            }
        }

        let (content, delta_content) = match event_type {
            "content_block_delta" => {
                let text = event["delta"]["text"].as_str().unwrap_or("");
                ("".to_string(), text.to_string())
            }
            "content_block_start" => {
                let text = event["content_block"]["text"].as_str().unwrap_or("");
                (text.to_string(), "".to_string())
            }
            _ => ("".to_string(), "".to_string()),
        };

        Ok(ChatResponse {
            id: None,
            object: Some("chat.completion.chunk".to_string()),
            created: None,
            model: None,
            choices: vec![crate::types::Choice {
                index: 0,
                message: if !content.is_empty() {
                    Some(crate::types::ResponseMessage {
                        role: Some("assistant".to_string()),
                        content: Some(content),
                        reasoning_content: None,
                        reasoning: None,
                        thinking: None,
                        thought: None,
                        reasoning_details: None,
                        tool_calls: None,
                    })
                } else {
                    None
                },
                delta: if !delta_content.is_empty() {
                    Some(crate::types::ResponseDelta {
                        role: None,
                        content: Some(delta_content),
                        reasoning_content: None,
                        reasoning: None,
                        thinking: None,
                        thought: None,
                        reasoning_details: None,
                        tool_calls: None,
                    })
                } else {
                    None
                },
                finish_reason: None,
            }],
            usage,
        })
    }
}

fn extract_anthropic_stream_usage(event: &serde_json::Value) -> Option<crate::types::Usage> {
    let usage = event.get("usage").or_else(|| {
        event
            .get("message")
            .and_then(|message| message.get("usage"))
    })?;
    let input = usage["input_tokens"]
        .as_u64()
        .map(|value| value.min(u32::MAX as u64) as u32);
    let output = usage["output_tokens"]
        .as_u64()
        .map(|value| value.min(u32::MAX as u64) as u32);
    if input.is_none() && output.is_none() {
        return None;
    }
    Some(crate::types::Usage {
        details: Default::default(),
        prompt_tokens: input,
        completion_tokens: output,
        total_tokens: match (input, output) {
            (Some(input), Some(output)) => Some(input.saturating_add(output)),
            _ => None,
        },
        cost: None,
    })
}

/// 从 messages 中提取 system 消息内容（Anthropic API 要求 system 在顶层）
fn extract_system_messages(messages: &[crate::types::Message]) -> Option<String> {
    let systems: Vec<&str> = messages
        .iter()
        .filter(|m| m.role == "system")
        .filter_map(|m| match &m.content {
            crate::types::MessageContent::Text(t) => Some(t.as_str()),
            _ => None,
        })
        .collect();

    if systems.is_empty() {
        None
    } else {
        Some(systems.join("\n\n"))
    }
}

/// 从 Anthropic 响应中提取 tool_use 内容块并转换为 OpenAI 格式的 tool_calls
fn extract_anthropic_tool_uses(
    response: &serde_json::Value,
) -> Option<Vec<crate::types::ToolCall>> {
    let tool_uses: Vec<crate::types::ToolCall> = response["content"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter(|c| c["type"] == "tool_use")
                .map(|c| crate::types::ToolCall {
                    index: None,
                    id: c["id"].as_str().unwrap_or("").to_string(),
                    call_type: "function".to_string(),
                    function: crate::types::FunctionCall {
                        name: c["name"].as_str().unwrap_or("").to_string(),
                        arguments: c["input"]
                            .as_object()
                            .map(|o| serde_json::to_string(o).unwrap_or_default())
                            .unwrap_or_else(|| c["input"].as_str().unwrap_or("{}").to_string()),
                    },
                })
                .collect()
        })
        .unwrap_or_default();

    if tool_uses.is_empty() {
        None
    } else {
        Some(tool_uses)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_convert_anthropic_response() {
        let response = serde_json::json!({
            "id": "msg_123",
            "type": "message",
            "model": "claude-sonnet-4-20250514",
            "content": [{"type": "text", "text": "Hello, world!"}],
            "stop_reason": "end_turn",
            "usage": {"input_tokens": 10, "output_tokens": 20}
        });

        let chat_response = AnthropicClient::convert_anthropic_to_chat_response(&response).unwrap();
        assert_eq!(chat_response.id.as_deref(), Some("msg_123"));
        let choice = &chat_response.choices[0];
        assert_eq!(
            choice.message.as_ref().unwrap().content.as_deref(),
            Some("Hello, world!")
        );
    }

    #[test]
    fn streaming_tool_use_preserves_index_and_partial_json() {
        let start = serde_json::json!({
            "type": "content_block_start",
            "index": 1,
            "content_block": {
                "type": "tool_use",
                "id": "tool_1",
                "name": "otherone.call_agent",
                "input": {}
            }
        });
        let start =
            AnthropicClient::convert_anthropic_event_to_chat_response(&start.to_string()).unwrap();
        let start_call = &start.choices[0]
            .delta
            .as_ref()
            .unwrap()
            .tool_calls
            .as_ref()
            .unwrap()[0];
        assert_eq!(start_call.index, Some(1));
        assert_eq!(start_call.id, "tool_1");
        assert_eq!(start_call.function.name, "otherone.call_agent");

        let delta = serde_json::json!({
            "type": "content_block_delta",
            "index": 1,
            "delta": {
                "type": "input_json_delta",
                "partial_json": "{\"agent\":\"worker\"}"
            }
        });
        let delta =
            AnthropicClient::convert_anthropic_event_to_chat_response(&delta.to_string()).unwrap();
        let delta_call = &delta.choices[0]
            .delta
            .as_ref()
            .unwrap()
            .tool_calls
            .as_ref()
            .unwrap()[0];
        assert_eq!(delta_call.index, Some(1));
        assert_eq!(delta_call.function.arguments, "{\"agent\":\"worker\"}");
    }

    #[test]
    fn streaming_usage_is_extracted_from_start_and_delta_events() {
        let start = serde_json::json!({
            "type": "message_start",
            "message": { "usage": { "input_tokens": 12, "output_tokens": 0 } }
        });
        let start =
            AnthropicClient::convert_anthropic_event_to_chat_response(&start.to_string()).unwrap();
        assert_eq!(start.usage.unwrap().prompt_tokens, Some(12));

        let delta = serde_json::json!({
            "type": "message_delta",
            "usage": { "output_tokens": 4 }
        });
        let delta =
            AnthropicClient::convert_anthropic_event_to_chat_response(&delta.to_string()).unwrap();
        assert_eq!(delta.usage.unwrap().completion_tokens, Some(4));
    }

    #[test]
    fn test_base_url_no_trailing_slash() {
        let client = AnthropicClient::new(
            "test-key".to_string(),
            "https://api.anthropic.com/v1/".to_string(),
        );
        assert_eq!(client.base_url, "https://api.anthropic.com/v1");
    }
}

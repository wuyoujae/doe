// 作用：OpenAI HTTP 客户端 — 实现 AiProvider trait
// 关联：被 otherone-ai/lib.rs 的 invoke_model 入口调用
// 预期结果：通过 reqwest 发送 HTTP 请求到 OpenAI API

use async_trait::async_trait;
use futures::StreamExt;
use reqwest::Client as HttpClient;
use std::collections::VecDeque;

use crate::error::AiError;
use crate::http_transport::{send_external_ai_request, RequestTimeouts};
use crate::traits::{AiProvider, ChatStream};
use crate::types::{ChatRequest, ChatResponse, ProviderType};

/// OpenAI HTTP 客户端
pub struct OpenAiClient {
    http_client: HttpClient,
    api_key: String,
    base_url: String,
}

impl OpenAiClient {
    /// 创建新的 OpenAI 客户端
    pub fn new(api_key: String, base_url: String) -> Self {
        Self::try_new(api_key, base_url).expect("Failed to create OpenAI HTTP client")
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

        Ok(OpenAiClient {
            http_client,
            api_key,
            base_url,
        })
    }

    /// 构建请求体 JSON
    fn build_request_body(&self, request: &ChatRequest) -> serde_json::Value {
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

        body
    }
}

#[async_trait]
impl AiProvider for OpenAiClient {
    /// 非流式聊天请求
    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse, AiError> {
        let url = format!("{}/chat/completions", self.base_url);
        let body = self.build_request_body(&request);

        let response = send_external_ai_request(
            self.http_client
                .post(&url)
                .header("Authorization", format!("Bearer {}", self.api_key))
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

        let chat_response: ChatResponse = response.json().await?;
        Ok(chat_response)
    }

    /// 流式聊天请求
    /// 作用：发送流式聊天请求到 OpenAI Chat Completions API
    /// 关联：实现 AiProvider trait
    /// 预期结果：返回 SSE 事件流，每个 item 是一个 ChatResponse chunk
    async fn chat_stream(&self, request: ChatRequest) -> Result<ChatStream, AiError> {
        let url = format!("{}/chat/completions", self.base_url);
        let mut body = self.build_request_body(&request);
        body["stream"] = serde_json::json!(true);

        let response = send_external_ai_request(
            self.http_client
                .post(&url)
                .header("Authorization", format!("Bearer {}", self.api_key))
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

        // 将响应 byte stream 转换为 SSE 事件流
        let byte_stream = response.bytes_stream();
        let stream = futures::stream::unfold(
            (byte_stream, Vec::new(), VecDeque::new(), false),
            |(mut byte_stream, mut buffer, mut queue, mut done)| async move {
                loop {
                    if let Some(item) = queue.pop_front() {
                        return Some((item, (byte_stream, buffer, queue, done)));
                    }

                    if done {
                        return None;
                    }

                    match byte_stream.next().await {
                        Some(Ok(bytes)) => {
                            buffer.extend_from_slice(&bytes);
                            drain_sse_buffer(&mut buffer, &mut queue, &mut done);
                        }
                        Some(Err(error)) => {
                            done = true;
                            return Some((
                                Err(AiError::HttpError(error)),
                                (byte_stream, buffer, queue, done),
                            ));
                        }
                        None => {
                            if !buffer.is_empty() {
                                let line = std::mem::take(&mut buffer);
                                push_sse_line(&line, &mut queue, &mut done);
                                if let Some(item) = queue.pop_front() {
                                    return Some((item, (byte_stream, buffer, queue, done)));
                                }
                            }
                            return None;
                        }
                    }
                }
            },
        );

        Ok(Box::pin(stream))
    }

    fn provider_type(&self) -> ProviderType {
        ProviderType::OpenAI
    }
}

fn drain_sse_buffer(
    buffer: &mut Vec<u8>,
    queue: &mut VecDeque<Result<ChatResponse, AiError>>,
    done: &mut bool,
) {
    while let Some(newline_index) = buffer.iter().position(|byte| *byte == b'\n') {
        let line: Vec<u8> = buffer.drain(..=newline_index).collect();
        push_sse_line(&line, queue, done);
        if *done {
            buffer.clear();
            return;
        }
    }
}

fn push_sse_line(
    line: &[u8],
    queue: &mut VecDeque<Result<ChatResponse, AiError>>,
    done: &mut bool,
) {
    let line = trim_sse_line(line);
    if line.is_empty() {
        return;
    }

    let line = match std::str::from_utf8(line) {
        Ok(line) => line.trim(),
        Err(error) => {
            queue.push_back(Err(AiError::StreamError(format!(
                "Invalid UTF-8 in SSE line: {error}"
            ))));
            return;
        }
    };

    if line.is_empty() || line.starts_with(':') {
        return;
    }

    let Some(data) = line.strip_prefix("data:") else {
        return;
    };

    let data = data.trim_start();
    if data == "[DONE]" {
        *done = true;
        return;
    }

    match serde_json::from_str::<ChatResponse>(data) {
        Ok(chunk) => queue.push_back(Ok(chunk)),
        Err(error) => queue.push_back(Err(AiError::StreamError(format!(
            "Invalid SSE JSON: {error}"
        )))),
    }
}

fn trim_sse_line(line: &[u8]) -> &[u8] {
    let mut end = line.len();
    while end > 0 && matches!(line[end - 1], b'\n' | b'\r') {
        end -= 1;
    }
    &line[..end]
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;

    #[test]
    fn test_build_request_body_basic() {
        let client = OpenAiClient::new(
            "test-key".to_string(),
            "https://api.openai.com/v1".to_string(),
        );
        let request = ChatRequest {
            model: "gpt-4".to_string(),
            messages: vec![],
            max_tokens: Some(100),
            temperature: Some(0.7),
            top_p: None,
            tools: None,
            tool_choice: None,
            stream: None,
            extra: None,
        };
        let body = client.build_request_body(&request);
        assert_eq!(body["model"], "gpt-4");
        assert_eq!(body["max_tokens"], 100);
        assert!((body["temperature"].as_f64().unwrap() - 0.7).abs() < 0.001);
    }

    #[test]
    fn test_base_url_no_trailing_slash() {
        let client = OpenAiClient::new(
            "test-key".to_string(),
            "https://api.openai.com/v1/".to_string(),
        );
        assert_eq!(client.base_url, "https://api.openai.com/v1");
    }

    #[test]
    fn streaming_client_allows_long_responses_with_bounded_idle_reads() {
        let timeouts = RequestTimeouts::default();
        assert!(timeouts.read > std::time::Duration::from_secs(120));
        assert!(timeouts.request > timeouts.read);
        assert!(timeouts.connect < timeouts.read);
    }

    #[test]
    fn sse_parser_preserves_split_json_frame() {
        let mut buffer = Vec::new();
        let mut queue = VecDeque::new();
        let mut done = false;

        buffer.extend_from_slice(br#"data: {"choices":[{"index":0,"delta":{"content":"hel"#);
        drain_sse_buffer(&mut buffer, &mut queue, &mut done);
        assert!(queue.is_empty());
        assert!(!buffer.is_empty());

        buffer.extend_from_slice(br#"lo"},"finish_reason":null}]}"#);
        buffer.extend_from_slice(b"\n");
        drain_sse_buffer(&mut buffer, &mut queue, &mut done);

        let chunk = queue.pop_front().unwrap().unwrap();
        assert_eq!(
            chunk.choices[0].delta.as_ref().unwrap().content.as_deref(),
            Some("hello")
        );
        assert!(buffer.is_empty());
        assert!(!done);
    }

    #[test]
    fn sse_parser_handles_multiple_frames_and_done() {
        let mut buffer = Vec::new();
        let mut queue = VecDeque::new();
        let mut done = false;

        buffer.extend_from_slice(
            br#"data: {"choices":[{"index":0,"delta":{"content":"a"},"finish_reason":null}]}
data: {"choices":[{"index":0,"delta":{"content":"b"},"finish_reason":null}]}
data: [DONE]
"#,
        );
        drain_sse_buffer(&mut buffer, &mut queue, &mut done);

        let first = queue.pop_front().unwrap().unwrap();
        let second = queue.pop_front().unwrap().unwrap();
        assert_eq!(
            first.choices[0].delta.as_ref().unwrap().content.as_deref(),
            Some("a")
        );
        assert_eq!(
            second.choices[0].delta.as_ref().unwrap().content.as_deref(),
            Some("b")
        );
        assert!(queue.is_empty());
        assert!(done);
        assert!(buffer.is_empty());
    }
}

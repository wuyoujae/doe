// 作用：定义 AI Provider trait 接口
// 关联：被 openai/anthropic/fetch 客户端实现
// 预期结果：提供统一的 AiProvider trait

use async_trait::async_trait;
use futures::stream::Stream;
use std::pin::Pin;

use crate::error::AiError;
use crate::types::{ChatRequest, ChatResponse};

/// 流式响应的 chunk 类型
pub type StreamChunk = Result<ChatResponse, AiError>;
/// 流式响应的 Stream 类型
pub type ChatStream = Pin<Box<dyn Stream<Item = StreamChunk> + Send>>;

/// Execution events are separate from provider chunks and are never sent upstream.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelAttempt {
    pub request_id: String,
    pub attempt_id: String,
    pub candidate_index: usize,
    pub attempt_number: u32,
    pub reset: bool,
}

pub enum ModelEvent { Chunk(ChatResponse), Attempt(ModelAttempt) }
pub type ModelEventStream = Pin<Box<dyn Stream<Item = Result<ModelEvent, AiError>> + Send>>;
pub type ExecutionFuture<'a, T> = Pin<Box<dyn std::future::Future<Output = Result<T, AiError>> + Send + 'a>>;

/// An injected request executor owns transport retries and provider-specific admission.
/// It receives one logical model request, without access to Agent tools or their side effects.
pub trait ModelExecutor: Send + Sync + std::fmt::Debug {
    fn stream(&self, config: serde_json::Value) -> ExecutionFuture<'_, ModelEventStream>;

    fn complete(&self, mut config: serde_json::Value) -> ExecutionFuture<'_, ChatResponse> {
        Box::pin(async move {
            use futures::StreamExt;
            config["stream"] = serde_json::Value::Bool(false);
            let mut stream = self.stream(config).await?;
            let mut response = None;
            while let Some(event) = stream.next().await {
                match event? {
                    ModelEvent::Chunk(chunk) => response = Some(chunk),
                    ModelEvent::Attempt(_) => response = None,
                }
            }
            response.ok_or_else(|| AiError::InvalidResponse("The model returned no completion.".into()))
        })
    }
}

/// AI Provider 核心 trait
#[async_trait]
pub trait AiProvider: Send + Sync {
    /// 非流式聊天请求
    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse, AiError>;

    /// 流式聊天请求
    async fn chat_stream(&self, request: ChatRequest) -> Result<ChatStream, AiError>;

    /// 返回 provider 类型
    fn provider_type(&self) -> crate::types::ProviderType;
}

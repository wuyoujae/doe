// 作用：定义所有 AI 提供商通用的类型
// 关联：被各个 provider 子模块（openai、anthropic、fetch）导入使用
// 预期结果：提供统一的基础类型定义，各 provider 可以基于此扩展

use serde::{Deserialize, Serialize};
use std::borrow::Cow;

/// AI 提供商类型
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ProviderType {
    OpenAI,
    Anthropic,
    Fetch,
    OpenRouter,
    Local,
}

impl std::fmt::Display for ProviderType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProviderType::OpenAI => write!(f, "openai"),
            ProviderType::Anthropic => write!(f, "anthropic"),
            ProviderType::Fetch => write!(f, "fetch"),
            ProviderType::OpenRouter => write!(f, "openrouter"),
            ProviderType::Local => write!(f, "local"),
        }
    }
}

/// 消息角色
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    System,
    User,
    Assistant,
    Tool,
    Developer,
}

/// 通用消息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reasoning_content: Option<String>,
    pub role: String,
    pub content: MessageContent,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
}

/// 消息内容（支持纯文本和多模态）
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum MessageContent {
    Text(String),
    MultiPart(Vec<ContentPart>),
}

/// 多模态内容的一个部分
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct ContentPart {
    #[serde(rename = "type")]
    pub content_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<ImageUrl>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_url: Option<VideoUrl>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input_audio: Option<InputAudio>,
}

/// 图片 URL 结构
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ImageUrl {
    pub url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

/// Video URL content used by OpenAI-compatible multimodal providers.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VideoUrl {
    pub url: String,
}

/// Base64-encoded audio content used by OpenAI-compatible multimodal providers.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct InputAudio {
    pub data: String,
    pub format: String,
}

impl ContentPart {
    pub fn text(text: impl Into<String>) -> Self {
        Self {
            content_type: "text".to_string(),
            text: Some(text.into()),
            ..Self::default()
        }
    }

    pub fn image_url(url: impl Into<String>, detail: Option<String>) -> Self {
        Self {
            content_type: "image_url".to_string(),
            image_url: Some(ImageUrl {
                url: url.into(),
                detail,
            }),
            ..Self::default()
        }
    }

    pub fn video_url(url: impl Into<String>) -> Self {
        Self {
            content_type: "video_url".to_string(),
            video_url: Some(VideoUrl { url: url.into() }),
            ..Self::default()
        }
    }

    pub fn input_audio(data: impl Into<String>, format: impl Into<String>) -> Self {
        Self {
            content_type: "input_audio".to_string(),
            input_audio: Some(InputAudio {
                data: data.into(),
                format: format.into(),
            }),
            ..Self::default()
        }
    }
}

/// 工具调用
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub index: Option<u32>,
    #[serde(default)]
    pub id: String,
    #[serde(rename = "type", default = "default_tool_call_type")]
    pub call_type: String,
    #[serde(default)]
    pub function: FunctionCall,
}

fn default_tool_call_type() -> String {
    "function".to_string()
}

/// 函数调用
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct FunctionCall {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub arguments: String,
}

/// 工具定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tool {
    #[serde(rename = "type")]
    pub tool_type: String,
    pub function: FunctionDefinition,
}

/// 函数定义（工具的 function 部分）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionDefinition {
    pub name: String,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameters: Option<serde_json::Value>,
}

/// 通用配置参数
#[derive(Debug, Clone)]
pub struct ConfigOptions {
    /// API 提供商类型
    pub provider: ProviderType,
    /// API 密钥
    pub api_key: String,
    /// 基础 URL
    pub base_url: String,
}

/// 通用聊天请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<Message>,
    #[serde(alias = "maxTokens", skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<Vec<Tool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_choice: Option<ToolChoice>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra: Option<serde_json::Map<String, serde_json::Value>>,
}

/// 工具选择策略
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ToolChoice {
    String(String),
    Object {
        #[serde(rename = "type")]
        choice_type: String,
        function: ToolChoiceFunction,
    },
}

impl ToolChoice {
    /// Select one exact function using the OpenAI-compatible named-tool shape.
    pub fn function(name: impl Into<String>) -> Self {
        Self::Object {
            choice_type: "function".to_string(),
            function: ToolChoiceFunction { name: name.into() },
        }
    }
}

/// 工具选择的函数指定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolChoiceFunction {
    pub name: String,
}

/// 通用聊天响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub id: Option<String>,
    pub object: Option<String>,
    pub created: Option<i64>,
    pub model: Option<String>,
    pub choices: Vec<Choice>,
    pub usage: Option<Usage>,
}

/// 响应中的单个选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Choice {
    pub index: u32,
    pub message: Option<ResponseMessage>,
    pub delta: Option<ResponseDelta>,
    pub finish_reason: Option<String>,
}

/// 非流式响应消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResponseMessage {
    pub role: Option<String>,
    pub content: Option<String>,
    #[serde(alias = "reasoningContent")]
    pub reasoning_content: Option<String>,
    pub reasoning: Option<String>,
    pub thinking: Option<String>,
    pub thought: Option<String>,
    #[serde(default)]
    pub reasoning_details: Option<Vec<serde_json::Value>>,
    pub tool_calls: Option<Vec<ToolCall>>,
}

impl ResponseMessage {
    pub fn visible_reasoning(&self) -> Option<Cow<'_, str>> {
        visible_reasoning(
            [
                self.reasoning_content.as_deref(),
                self.reasoning.as_deref(),
                self.thinking.as_deref(),
                self.thought.as_deref(),
            ],
            self.reasoning_details.as_deref(),
        )
    }
}

/// 流式响应的增量消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResponseDelta {
    pub role: Option<String>,
    pub content: Option<String>,
    #[serde(alias = "reasoningContent")]
    pub reasoning_content: Option<String>,
    pub reasoning: Option<String>,
    pub thinking: Option<String>,
    pub thought: Option<String>,
    #[serde(default)]
    pub reasoning_details: Option<Vec<serde_json::Value>>,
    pub tool_calls: Option<Vec<ToolCall>>,
}

impl ResponseDelta {
    pub fn visible_reasoning(&self) -> Option<Cow<'_, str>> {
        visible_reasoning(
            [
                self.reasoning_content.as_deref(),
                self.reasoning.as_deref(),
                self.thinking.as_deref(),
                self.thought.as_deref(),
            ],
            self.reasoning_details.as_deref(),
        )
    }
}

fn visible_reasoning<'a>(
    aliases: [Option<&'a str>; 4],
    details: Option<&[serde_json::Value]>,
) -> Option<Cow<'a, str>> {
    if let Some(content) = aliases
        .into_iter()
        .flatten()
        .find(|content| !content.is_empty())
    {
        return Some(Cow::Borrowed(content));
    }

    let visible = details?
        .iter()
        .filter_map(
            |detail| match detail.get("type").and_then(serde_json::Value::as_str) {
                Some("reasoning.summary") => detail.get("summary"),
                Some("reasoning.text") => detail.get("text"),
                _ => None,
            },
        )
        .filter_map(serde_json::Value::as_str)
        .filter(|content| !content.is_empty())
        .collect::<Vec<_>>();
    (!visible.is_empty()).then(|| Cow::Owned(visible.join("\n\n")))
}

/// Token 使用量
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Usage {
    #[serde(default, flatten)]
    pub details: std::collections::BTreeMap<String, serde_json::Value>,
    pub prompt_tokens: Option<u32>,
    pub completion_tokens: Option<u32>,
    pub total_tokens: Option<u32>,
    #[serde(default)]
    pub cost: Option<serde_json::Value>,
}

/// 统一解析后的响应（provider 无关）
#[derive(Debug, Clone)]
pub struct ParsedResponse {
    /// 消息内容
    pub content: String,
    /// 角色
    pub role: String,
    /// Token 消耗
    pub token_consumption: u32,
    /// 工具调用
    pub tools: Option<ToolCallsWrapper>,
    /// 思考内容
    pub thinking: Option<String>,
    /// 原始响应（保留供后续处理）
    pub raw_response: Option<serde_json::Value>,
}

/// 工具调用包装
#[derive(Debug, Clone)]
pub struct ToolCallsWrapper {
    pub tool_calls: Vec<ToolCall>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn response_delta_preserves_reasoning_content_fields() {
        let snake: ResponseDelta = serde_json::from_value(serde_json::json!({
            "role": "assistant",
            "reasoning_content": "thinking",
            "content": "answer"
        }))
        .unwrap();

        assert_eq!(snake.reasoning_content.as_deref(), Some("thinking"));
        assert_eq!(snake.content.as_deref(), Some("answer"));

        let camel: ResponseDelta = serde_json::from_value(serde_json::json!({
            "reasoningContent": "camel thinking"
        }))
        .unwrap();

        assert_eq!(camel.reasoning_content.as_deref(), Some("camel thinking"));

        let serialized = serde_json::to_value(&camel).unwrap();
        assert_eq!(serialized["reasoning_content"], "camel thinking");
    }

    #[test]
    fn response_message_preserves_reasoning_content_fields() {
        let message: ResponseMessage = serde_json::from_value(serde_json::json!({
            "role": "assistant",
            "reasoningContent": "non-stream thinking",
            "content": "answer"
        }))
        .unwrap();

        assert_eq!(
            message.reasoning_content.as_deref(),
            Some("non-stream thinking")
        );
        assert_eq!(message.content.as_deref(), Some("answer"));
    }

    #[test]
    fn response_delta_exposes_openrouter_reasoning_details() {
        let delta: ResponseDelta = serde_json::from_value(serde_json::json!({
            "reasoning_details": [
                {
                    "type": "reasoning.summary",
                    "summary": "Checked the constraints."
                },
                {
                    "type": "reasoning.encrypted",
                    "data": "must-not-be-visible"
                },
                {
                    "type": "reasoning.text",
                    "text": "Built the content structure."
                }
            ]
        }))
        .unwrap();

        assert_eq!(
            delta.visible_reasoning().as_deref(),
            Some("Checked the constraints.\n\nBuilt the content structure.")
        );
    }

    #[test]
    fn response_message_prefers_reasoning_alias_without_duplicating_details() {
        let message: ResponseMessage = serde_json::from_value(serde_json::json!({
            "reasoning": "Visible reasoning",
            "reasoning_details": [{
                "type": "reasoning.text",
                "text": "Duplicate structured reasoning"
            }]
        }))
        .unwrap();

        assert_eq!(
            message.visible_reasoning().as_deref(),
            Some("Visible reasoning")
        );
    }

    #[test]
    fn response_message_does_not_expose_encrypted_reasoning_details() {
        let message: ResponseMessage = serde_json::from_value(serde_json::json!({
            "reasoning_details": [{
                "type": "reasoning.encrypted",
                "data": "must-not-be-visible"
            }]
        }))
        .unwrap();

        assert!(message.visible_reasoning().is_none());
    }

    #[test]
    fn multimodal_content_parts_use_openai_compatible_shapes() {
        let content = MessageContent::MultiPart(vec![
            ContentPart::text("describe these files"),
            ContentPart::image_url("https://cdn.example/image.png", Some("high".to_string())),
            ContentPart::video_url("https://cdn.example/video.mp4"),
            ContentPart::input_audio("YmFzZTY0", "wav"),
        ]);

        let serialized = serde_json::to_value(content).unwrap();
        assert_eq!(
            serialized[0],
            serde_json::json!({
                "type": "text",
                "text": "describe these files"
            })
        );
        assert_eq!(
            serialized[1],
            serde_json::json!({
                "type": "image_url",
                "image_url": {
                    "url": "https://cdn.example/image.png",
                    "detail": "high"
                }
            })
        );
        assert_eq!(
            serialized[2],
            serde_json::json!({
                "type": "video_url",
                "video_url": { "url": "https://cdn.example/video.mp4" }
            })
        );
        assert_eq!(
            serialized[3],
            serde_json::json!({
                "type": "input_audio",
                "input_audio": { "data": "YmFzZTY0", "format": "wav" }
            })
        );

        let restored: MessageContent = serde_json::from_value(serialized).unwrap();
        assert!(matches!(restored, MessageContent::MultiPart(parts) if parts.len() == 4));
    }
}


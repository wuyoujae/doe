// 作用：定义 OpenAI 专用的类型（扩展通用 ConfigOptions）
// 关联：被 openai/client.rs 使用
// 预期结果：提供 OpenAI 特有的参数类型定义

use serde::Deserialize;

/// OpenAI 专用配置参数
#[derive(Debug, Clone, Deserialize)]
pub struct ConfigOptions {
    /// 基础 provider 类型
    pub provider: Option<serde_json::Value>,
    /// API 密钥
    pub api_key: Option<String>,
    /// 基础 URL
    pub base_url: Option<String>,
    /// 模型名称
    pub model: String,
    /// 消息列表
    #[serde(default)]
    pub messages: Vec<crate::types::Message>,
    /// 上下文长度限制
    #[serde(rename = "contextLength")]
    pub context_length: Option<u32>,
    #[serde(rename = "maxTokens", alias = "max_tokens")]
    pub max_tokens: Option<u32>,
    #[serde(rename = "connectTimeoutSeconds", alias = "connect_timeout_seconds")]
    pub connect_timeout_seconds: Option<u64>,
    #[serde(rename = "readTimeoutSeconds", alias = "read_timeout_seconds")]
    pub read_timeout_seconds: Option<u64>,
    #[serde(rename = "requestTimeoutSeconds", alias = "request_timeout_seconds")]
    pub request_timeout_seconds: Option<u64>,
    /// 采样温度
    pub temperature: Option<f32>,
    /// 核采样参数
    #[serde(rename = "topP")]
    pub top_p: Option<f32>,
    /// 工具定义数组
    pub tools: Option<Vec<crate::types::Tool>>,
    /// 控制工具调用行为
    #[serde(rename = "toolChoice")]
    pub tool_choice: Option<crate::types::ToolChoice>,
    /// 是否启用并行工具调用
    #[serde(rename = "parallelToolCalls")]
    pub parallel_tool_calls: Option<bool>,
    /// 启用流式响应
    pub stream: Option<bool>,
    /// 其他兼容参数
    pub other: Option<OtherParams>,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

/// 其他兼容参数
#[derive(Debug, Clone, Deserialize)]
pub struct OtherParams {
    /// 客户端构建参数
    pub client: Option<serde_json::Value>,
    /// 聊天请求参数
    pub chat: Option<serde_json::Value>,
}

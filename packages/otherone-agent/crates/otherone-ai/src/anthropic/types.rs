// 作用：定义 Anthropic 专用的类型
// 关联：被 anthropic/client.rs 使用
// 预期结果：提供 Anthropic 特有的参数类型定义

use serde::Deserialize;

/// Anthropic 专用配置参数
#[derive(Debug, Clone, Deserialize)]
pub struct ConfigOptions {
    /// 基础 provider 类型
    pub provider: Option<String>,
    /// API 密钥
    pub api_key: Option<String>,
    /// 基础 URL
    pub base_url: Option<String>,
    /// 模型名称
    pub model: String,
    /// 消息列表
    #[serde(default)]
    pub messages: Vec<crate::types::Message>,
    /// 最大 token 数
    #[serde(rename = "maxTokens", alias = "max_tokens")]
    pub max_tokens: Option<u32>,
    /// 采样温度
    pub temperature: Option<f32>,
    /// 核采样参数
    #[serde(rename = "topP")]
    pub top_p: Option<f32>,
    /// 系统提示词
    pub system: Option<String>,
    /// 工具定义数组
    pub tools: Option<Vec<crate::types::Tool>>,
    /// 启用流式响应
    pub stream: Option<bool>,
}

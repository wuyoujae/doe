// 作用：otherone-ai 模块的错误类型定义
// 关联：被 openai/anthropic/fetch 客户端和 traits 使用
// 预期结果：提供统一的错误类型，支持不同来源的错误转换

use thiserror::Error;

/// AI 层所有可能的错误
#[derive(Error, Debug)]
pub enum AiError {
    /// A stable application execution code, without upstream credentials or bodies.
    #[error("{code}: {message}")]
    Execution { code: String, message: String },
    /// HTTP 请求失败
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    /// JSON 序列化/反序列化失败
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    /// API 返回错误响应
    #[error("API error [{status}]: {message}")]
    ApiError { status: u16, message: String },

    /// 配置参数错误
    #[error("Configuration error: {0}")]
    ConfigError(String),

    /// 不支持的 provider 类型
    #[error("Unsupported provider type: {0}")]
    UnsupportedProvider(String),

    /// 流式响应解析失败
    #[error("Stream parsing error: {0}")]
    StreamError(String),

    /// 响应格式无效
    #[error("Invalid response format: {0}")]
    InvalidResponse(String),

    /// 其他通用错误
    #[error("{0}")]
    Other(String),
}

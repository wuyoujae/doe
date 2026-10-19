// 作用：MCP 错误类型
// 关联：被 client.rs 和 lib.rs 使用

use thiserror::Error;

#[derive(Error, Debug)]
pub enum McpError {
    /// JSON 序列化错误
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    /// HTTP 错误
    #[error("HTTP error: {0}")]
    HttpError(#[from] reqwest::Error),

    /// IO 错误
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    /// 配置错误
    #[error("Configuration error: {0}")]
    ConfigError(String),

    /// 连接错误
    #[error("Connection error: {0}")]
    ConnectionError(String),

    /// 协议错误
    #[error("Protocol error: {0}")]
    ProtocolError(String),

    /// 不支持的传输类型
    #[error("Unsupported transport: {0}")]
    UnsupportedTransport(String),

    /// 工具未找到
    #[error("Tool not found: {0}")]
    ToolNotFound(String),

    /// 工具调用错误
    #[error("Tool call error: {0}")]
    ToolCallError(String),
}

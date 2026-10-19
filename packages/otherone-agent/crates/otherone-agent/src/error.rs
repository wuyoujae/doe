// 作用：Agent 循环模块的错误类型
// 关联：被 otherone-agent 内部使用

use thiserror::Error;

#[derive(Error, Debug)]
pub enum AgentError {
    #[error("Invalid configuration: {0}")]
    InvalidConfiguration(String),

    #[error("Agent not found: {0}")]
    AgentNotFound(String),

    #[error("Agent call denied: {caller} -> {target}")]
    AgentCallDenied { caller: String, target: String },

    #[error("Agent call cycle detected: {0}")]
    AgentCallCycle(String),

    #[error("Maximum Agent call depth exceeded: {0}")]
    MaxDepthExceeded(usize),

    #[error("Runtime budget exceeded: {0}")]
    BudgetExceeded(String),

    #[error("Session already has an active writer: {0}")]
    SessionBusy(String),

    #[error("Agent run timed out")]
    TimedOut,

    #[error("Agent run cancelled")]
    Cancelled,

    #[error("AI error: {0}")]
    AiError(#[from] otherone_ai::error::AiError),

    #[error("Context error: {0}")]
    ContextError(String),

    #[error("Message resolver error: {0}")]
    MessageResolution(String),

    #[error("Model response observer error: {0}")]
    ModelResponseObservation(String),

    #[error("Tool error: {0}")]
    ToolError(String),

    #[error("Required terminal tool contract failed: {0}")]
    RequiredTerminalTool(String),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Max iterations exceeded: {0}")]
    MaxIterationsExceeded(u32),
}

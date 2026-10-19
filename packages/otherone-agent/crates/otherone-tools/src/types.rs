// 作用：定义 tools 模块的类型
// 关联：被 tools/lib.rs 使用
// 预期结果：提供工具调用相关的类型定义

use serde::{Deserialize, Serialize};
use std::time::Instant;
use tokio_util::sync::CancellationToken;

/// Tools 配置参数类型
#[derive(Debug, Clone)]
pub struct ToolsOptions {
    /// 工具数组
    pub tools: Vec<otherone_ai::types::Tool>,
}

/// 工具调用结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    /// tool_call 的 ID
    pub tool_call_id: String,
    /// 函数名称
    pub function_name: String,
    /// 调用结果
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    /// 错误信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    /// 结构化错误类别。
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_kind: Option<ToolErrorKind>,
}

/// 异步工具错误分类。Recoverable 错误可以作为 tool result 返回给模型继续处理。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ToolErrorKind {
    Recoverable,
    InvalidArguments,
    PermissionDenied,
    TimedOut,
    Cancelled,
    Fatal,
}

/// 结构化工具错误。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ToolError {
    pub kind: ToolErrorKind,
    pub message: String,
}

impl ToolError {
    pub fn new(kind: ToolErrorKind, message: impl Into<String>) -> Self {
        Self {
            kind,
            message: message.into(),
        }
    }

    pub fn recoverable(message: impl Into<String>) -> Self {
        Self::new(ToolErrorKind::Recoverable, message)
    }

    pub fn invalid_arguments(message: impl Into<String>) -> Self {
        Self::new(ToolErrorKind::InvalidArguments, message)
    }

    pub fn cancelled() -> Self {
        Self::new(ToolErrorKind::Cancelled, "tool call cancelled")
    }
}

impl std::fmt::Display for ToolError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for ToolError {}

/// Delegating 工具在等待子运行时不占普通工具并发许可。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ToolExecutionClass {
    Standard,
    Delegating,
}

/// 一次工具调用可见的运行上下文。
#[derive(Debug, Clone)]
pub struct ToolCallContext {
    pub tool_call_id: String,
    pub run_id: String,
    pub root_run_id: String,
    pub agent_id: String,
    pub session_id: Option<String>,
    pub runtime_context: Option<serde_json::Value>,
    pub metadata: serde_json::Value,
    pub deadline: Option<Instant>,
    pub cancellation: CancellationToken,
}

impl ToolCallContext {
    pub fn new(
        run_id: impl Into<String>,
        root_run_id: impl Into<String>,
        agent_id: impl Into<String>,
        cancellation: CancellationToken,
    ) -> Self {
        Self {
            tool_call_id: String::new(),
            run_id: run_id.into(),
            root_run_id: root_run_id.into(),
            agent_id: agent_id.into(),
            session_id: None,
            runtime_context: None,
            metadata: serde_json::json!({}),
            deadline: None,
            cancellation,
        }
    }

    pub fn for_tool_call(&self, tool_call_id: impl Into<String>) -> Self {
        let mut context = self.clone();
        context.tool_call_id = tool_call_id.into();
        context
    }
}

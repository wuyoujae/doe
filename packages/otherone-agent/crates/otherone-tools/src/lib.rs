// 作用：工具调用模块 — 处理 AI 返回的 tool_calls 并执行对应的函数实现
// 关联：被 otherone-agent 的 invoke_agent 循环调用
// 预期结果：执行 tool 调用并返回结果数组

pub mod types;

use async_trait::async_trait;
use futures::FutureExt;
use otherone_ai::types::ToolCall;
use std::collections::HashMap;
use std::sync::Arc;
use types::{ToolCallContext, ToolError, ToolErrorKind, ToolExecutionClass, ToolResult};

pub type ToolRealization = Box<dyn Fn(serde_json::Value, &str) -> String + Send + Sync>;
pub type ToolRealizationMap = HashMap<String, ToolRealization>;

/// 所有新工具使用的异步结构化执行接口。
#[async_trait]
pub trait ToolHandler: Send + Sync {
    async fn call(
        &self,
        arguments: serde_json::Value,
        context: ToolCallContext,
    ) -> Result<serde_json::Value, ToolError>;
}

/// 将旧同步闭包适配到异步工具接口。
pub struct SyncToolHandler<F> {
    function: F,
}

impl<F> SyncToolHandler<F> {
    pub fn new(function: F) -> Self {
        Self { function }
    }
}

#[async_trait]
impl<F> ToolHandler for SyncToolHandler<F>
where
    F: Fn(serde_json::Value) -> String + Send + Sync,
{
    async fn call(
        &self,
        arguments: serde_json::Value,
        _context: ToolCallContext,
    ) -> Result<serde_json::Value, ToolError> {
        Ok(serde_json::Value::String((self.function)(arguments)))
    }
}

/// 工具定义和实现的不可变注册项。
#[derive(Clone)]
pub struct ToolRegistration {
    pub definition: otherone_ai::types::Tool,
    pub handler: Arc<dyn ToolHandler>,
    pub execution_class: ToolExecutionClass,
}

impl ToolRegistration {
    pub fn new(definition: otherone_ai::types::Tool, handler: Arc<dyn ToolHandler>) -> Self {
        Self {
            definition,
            handler,
            execution_class: ToolExecutionClass::Standard,
        }
    }

    pub fn sync<F>(definition: otherone_ai::types::Tool, function: F) -> Self
    where
        F: Fn(serde_json::Value) -> String + Send + Sync + 'static,
    {
        Self::new(definition, Arc::new(SyncToolHandler::new(function)))
    }

    pub fn execution_class(mut self, execution_class: ToolExecutionClass) -> Self {
        self.execution_class = execution_class;
        self
    }

    pub fn name(&self) -> &str {
        &self.definition.function.name
    }
}

/// 可克隆的异步工具注册表。Handler 通过 Arc 共享。
#[derive(Clone, Default)]
pub struct ToolRegistry {
    registrations: HashMap<String, ToolRegistration>,
}

impl ToolRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&mut self, registration: ToolRegistration) -> Result<(), ToolError> {
        let name = registration.name().trim();
        if name.is_empty() {
            return Err(ToolError::invalid_arguments("tool name is required"));
        }
        if self.registrations.contains_key(name) {
            return Err(ToolError::invalid_arguments(format!(
                "tool '{name}' is already registered"
            )));
        }
        self.registrations.insert(name.to_string(), registration);
        Ok(())
    }

    pub fn replace(&mut self, registration: ToolRegistration) -> Result<(), ToolError> {
        let name = registration.name().trim();
        if name.is_empty() {
            return Err(ToolError::invalid_arguments("tool name is required"));
        }
        self.registrations.insert(name.to_string(), registration);
        Ok(())
    }

    pub fn get(&self, name: &str) -> Option<&ToolRegistration> {
        self.registrations.get(name)
    }

    pub fn contains(&self, name: &str) -> bool {
        self.registrations.contains_key(name)
    }

    pub fn len(&self) -> usize {
        self.registrations.len()
    }

    pub fn is_empty(&self) -> bool {
        self.registrations.is_empty()
    }

    pub fn definitions(&self) -> Vec<otherone_ai::types::Tool> {
        let mut definitions = self
            .registrations
            .values()
            .map(|registration| registration.definition.clone())
            .collect::<Vec<_>>();
        definitions.sort_by(|left, right| left.function.name.cmp(&right.function.name));
        definitions
    }

    pub fn definitions_for<'a>(
        &self,
        names: impl IntoIterator<Item = &'a str>,
    ) -> Result<Vec<otherone_ai::types::Tool>, ToolError> {
        let mut definitions = Vec::new();
        for name in names {
            let registration = self.get(name).ok_or_else(|| {
                ToolError::new(
                    ToolErrorKind::PermissionDenied,
                    format!("tool '{name}' is not registered"),
                )
            })?;
            definitions.push(registration.definition.clone());
        }
        definitions.sort_by(|left, right| left.function.name.cmp(&right.function.name));
        Ok(definitions)
    }

    pub fn subset<'a>(&self, names: impl IntoIterator<Item = &'a str>) -> Result<Self, ToolError> {
        let mut subset = Self::new();
        for name in names {
            let registration = self.get(name).ok_or_else(|| {
                ToolError::new(
                    ToolErrorKind::PermissionDenied,
                    format!("tool '{name}' is not registered"),
                )
            })?;
            subset.register(registration.clone())?;
        }
        Ok(subset)
    }

    pub async fn execute(&self, tool_call: &ToolCall, context: ToolCallContext) -> ToolResult {
        let function_name = tool_call.function.name.clone();
        let registration = match self.get(&function_name) {
            Some(registration) => registration,
            None => {
                return ToolResult {
                    tool_call_id: tool_call.id.clone(),
                    function_name,
                    result: None,
                    error: Some("tool is not registered or not allowed".to_string()),
                    error_kind: Some(ToolErrorKind::PermissionDenied),
                }
            }
        };

        let arguments = match parse_tool_arguments(tool_call) {
            Ok(arguments) => arguments,
            Err(error) => {
                return ToolResult {
                    tool_call_id: tool_call.id.clone(),
                    function_name,
                    result: None,
                    error: Some(error.to_string()),
                    error_kind: Some(error.kind),
                }
            }
        };

        let call_context = context.for_tool_call(tool_call.id.clone());
        let result =
            call_handler_with_control(Arc::clone(&registration.handler), arguments, call_context)
                .await;

        match result {
            Ok(value) => ToolResult {
                tool_call_id: tool_call.id.clone(),
                function_name,
                result: Some(value),
                error: None,
                error_kind: None,
            },
            Err(error) => ToolResult {
                tool_call_id: tool_call.id.clone(),
                function_name,
                result: None,
                error: Some(error.to_string()),
                error_kind: Some(error.kind),
            },
        }
    }
}

fn parse_tool_arguments(tool_call: &ToolCall) -> Result<serde_json::Value, ToolError> {
    let arguments = tool_call.function.arguments.trim();
    if arguments.is_empty() {
        return Ok(serde_json::json!({}));
    }
    serde_json::from_str(arguments).map_err(|error| {
        ToolError::invalid_arguments(format!(
            "failed to parse arguments for '{}': {error}",
            tool_call.function.name
        ))
    })
}

async fn call_handler_with_control(
    handler: Arc<dyn ToolHandler>,
    arguments: serde_json::Value,
    context: ToolCallContext,
) -> Result<serde_json::Value, ToolError> {
    let cancellation = context.cancellation.clone();
    let deadline = context.deadline;
    let call = std::panic::AssertUnwindSafe(handler.call(arguments, context)).catch_unwind();
    tokio::pin!(call);
    if let Some(deadline) = deadline {
        tokio::select! {
            _ = cancellation.cancelled() => Err(ToolError::cancelled()),
            _ = tokio::time::sleep_until(tokio::time::Instant::from_std(deadline)) => {
                Err(ToolError::new(ToolErrorKind::TimedOut, "tool call timed out"))
            }
            result = &mut call => flatten_tool_panic(result),
        }
    } else {
        tokio::select! {
            _ = cancellation.cancelled() => Err(ToolError::cancelled()),
            result = &mut call => flatten_tool_panic(result),
        }
    }
}

fn flatten_tool_panic(
    result: Result<Result<serde_json::Value, ToolError>, Box<dyn std::any::Any + Send>>,
) -> Result<serde_json::Value, ToolError> {
    match result {
        Ok(result) => result,
        Err(_) => Err(ToolError::new(
            ToolErrorKind::Fatal,
            "tool handler panicked",
        )),
    }
}

pub async fn process_tools_async(
    tool_calls: &[ToolCall],
    registry: &ToolRegistry,
    context: ToolCallContext,
) -> Result<Vec<ToolResult>, ToolError> {
    if tool_calls.is_empty() {
        return Err(ToolError::invalid_arguments("tool_calls array is empty"));
    }

    let mut results = Vec::with_capacity(tool_calls.len());
    for tool_call in tool_calls {
        results.push(registry.execute(tool_call, context.clone()).await);
    }
    Ok(results)
}

/// 处理 AI 返回的 tool 调用
/// 作用：解析 tool_calls 数组，从 tools_realize 映射中查找并执行对应的函数
/// 关联：被 agent loop 模块调用
/// 预期结果：执行 tool 调用并返回结果数组
pub fn process_tools(
    tool_calls: &[ToolCall],
    tools_realize: &ToolRealizationMap,
) -> Result<Vec<ToolResult>, String> {
    if tool_calls.is_empty() {
        return Err("tool_calls array is empty".to_string());
    }

    let mut results = Vec::new();

    for tool_call in tool_calls {
        let tool_call_id = &tool_call.id;
        let function_name = &tool_call.function.name;
        let arguments_str = &tool_call.function.arguments;

        // 查找对应的函数实现
        let function_impl = tools_realize
            .get(function_name)
            .ok_or_else(|| format!("Function '{}' not found in tools_realize", function_name))?;

        // 解析 arguments（JSON 字符串）→ 完整传给实现函数
        let args: serde_json::Value = if !arguments_str.is_empty() {
            serde_json::from_str(arguments_str)
                .map_err(|e| format!("Failed to parse arguments for '{}': {}", function_name, e))?
        } else {
            serde_json::Value::Object(serde_json::Map::new())
        };

        // 调用函数 — 传入完整的 JSON Value，由实现函数自行反序列化
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            function_impl(args, tool_call_id)
        }));
        match result {
            Ok(result) => results.push(ToolResult {
                tool_call_id: tool_call_id.clone(),
                function_name: function_name.clone(),
                result: Some(serde_json::Value::String(result)),
                error: None,
                error_kind: None,
            }),
            Err(_) => {
                eprintln!("tool_handler_panic tool={function_name}");
                let message = "Tool execution failed.";
                results.push(ToolResult {
                    tool_call_id: tool_call_id.clone(),
                    function_name: function_name.clone(),
                    result: Some(serde_json::Value::String(
                        serde_json::json!({ "error": message }).to_string(),
                    )),
                    error: Some(message.to_string()),
                    error_kind: Some(ToolErrorKind::Fatal),
                });
            }
        }
    }

    Ok(results)
}

/// 组合 tools 配置
/// 作用：合并并去重 tools 数组，为 process_tools 做准备
/// 关联：被 agent loop 模块在循环中调用
/// 预期结果：返回去重后的 tools 数组
pub fn combine_tools(
    tools: Option<Vec<otherone_ai::types::Tool>>,
) -> Option<Vec<otherone_ai::types::Tool>> {
    let tools = tools?;
    if tools.is_empty() {
        return Some(tools);
    }

    // 按 function.name 去重，保留第一个出现的
    let mut seen = std::collections::HashSet::new();
    let mut deduped = Vec::new();

    for tool in tools {
        if seen.insert(tool.function.name.clone()) {
            deduped.push(tool);
        }
    }

    Some(deduped)
}

#[cfg(test)]
mod tests {
    use super::*;
    use otherone_ai::types::{FunctionCall, ToolCall};

    #[test]
    fn test_process_tools_empty_array() {
        let result = process_tools(&[], &HashMap::new());
        assert!(result.is_err());
    }

    #[test]
    fn test_process_tools_function_not_found() {
        let tool_calls = vec![ToolCall {
            index: None,
            id: "call_1".to_string(),
            call_type: "function".to_string(),
            function: FunctionCall {
                name: "unknown_fn".to_string(),
                arguments: "{}".to_string(),
            },
        }];

        let result = process_tools(&tool_calls, &HashMap::new());
        assert!(result.is_err());
    }

    #[test]
    fn test_process_tools_success() {
        let tool_calls = vec![ToolCall {
            index: None,
            id: "call_1".to_string(),
            call_type: "function".to_string(),
            function: FunctionCall {
                name: "get_weather".to_string(),
                arguments: r#"{"city":"Beijing"}"#.to_string(),
            },
        }];

        let mut tools_realize = ToolRealizationMap::new();
        tools_realize.insert(
            "get_weather".to_string(),
            Box::new(|args: serde_json::Value, tool_call_id| {
                let city = args
                    .get("city")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown");
                format!("{tool_call_id}: Weather in {city}: sunny")
            }),
        );

        let result = process_tools(&tool_calls, &tools_realize).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].tool_call_id, "call_1");
        assert_eq!(result[0].function_name, "get_weather");
        assert_eq!(
            result[0].result,
            Some(serde_json::json!("call_1: Weather in Beijing: sunny"))
        );
        assert!(result[0].error.is_none());
    }

    #[test]
    fn process_tools_isolates_handler_panics_and_continues_the_batch() {
        let tool_calls = vec![
            ToolCall {
                index: None,
                id: "call_panic".to_string(),
                call_type: "function".to_string(),
                function: FunctionCall {
                    name: "panic_tool".to_string(),
                    arguments: "{}".to_string(),
                },
            },
            ToolCall {
                index: None,
                id: "call_ok".to_string(),
                call_type: "function".to_string(),
                function: FunctionCall {
                    name: "ok_tool".to_string(),
                    arguments: "{}".to_string(),
                },
            },
        ];
        let mut tools_realize = ToolRealizationMap::new();
        tools_realize.insert(
            "panic_tool".to_string(),
            Box::new(|_, _| panic!("test tool panic")),
        );
        tools_realize.insert(
            "ok_tool".to_string(),
            Box::new(|_, tool_call_id| format!("completed:{tool_call_id}")),
        );

        let results = process_tools(&tool_calls, &tools_realize).unwrap();

        assert_eq!(results.len(), 2);
        assert_eq!(results[0].error.as_deref(), Some("Tool execution failed."));
        assert_eq!(results[0].error_kind, Some(ToolErrorKind::Fatal));
        let panic_result = results[0]
            .result
            .as_ref()
            .and_then(serde_json::Value::as_str)
            .and_then(|value| serde_json::from_str::<serde_json::Value>(value).ok())
            .expect("panic result must remain a structured Tool error");
        assert_eq!(panic_result["error"], "Tool execution failed.");
        assert_eq!(
            results[1].result,
            Some(serde_json::json!("completed:call_ok"))
        );
        assert!(results[1].error.is_none());
    }

    #[test]
    fn test_combine_tools() {
        let tools = Some(vec![otherone_ai::types::Tool {
            tool_type: "function".to_string(),
            function: otherone_ai::types::FunctionDefinition {
                name: "test_fn".to_string(),
                description: "A test function".to_string(),
                parameters: None,
            },
        }]);
        let result = combine_tools(tools);
        assert!(result.is_some());
        assert_eq!(result.unwrap().len(), 1);
    }

    #[tokio::test]
    async fn async_registry_executes_legacy_sync_handler() {
        let definition = otherone_ai::types::Tool {
            tool_type: "function".to_string(),
            function: otherone_ai::types::FunctionDefinition {
                name: "echo".to_string(),
                description: "echo input".to_string(),
                parameters: Some(serde_json::json!({ "type": "object" })),
            },
        };
        let mut registry = ToolRegistry::new();
        registry
            .register(ToolRegistration::sync(definition, |arguments| {
                arguments["value"].as_str().unwrap_or_default().to_string()
            }))
            .unwrap();
        let call = ToolCall {
            index: None,
            id: "call_echo".to_string(),
            call_type: "function".to_string(),
            function: FunctionCall {
                name: "echo".to_string(),
                arguments: r#"{"value":"hello"}"#.to_string(),
            },
        };
        let context = types::ToolCallContext::new(
            "run",
            "root",
            "agent",
            tokio_util::sync::CancellationToken::new(),
        );

        let result = registry.execute(&call, context).await;
        assert_eq!(result.result, Some(serde_json::json!("hello")));
        assert!(result.error.is_none());
    }

    struct PendingHandler;

    #[async_trait]
    impl ToolHandler for PendingHandler {
        async fn call(
            &self,
            _arguments: serde_json::Value,
            _context: types::ToolCallContext,
        ) -> Result<serde_json::Value, types::ToolError> {
            std::future::pending().await
        }
    }

    #[tokio::test]
    async fn async_registry_observes_cancellation() {
        let definition = otherone_ai::types::Tool {
            tool_type: "function".to_string(),
            function: otherone_ai::types::FunctionDefinition {
                name: "pending".to_string(),
                description: "never completes".to_string(),
                parameters: None,
            },
        };
        let mut registry = ToolRegistry::new();
        registry
            .register(ToolRegistration::new(definition, Arc::new(PendingHandler)))
            .unwrap();
        let cancellation = tokio_util::sync::CancellationToken::new();
        cancellation.cancel();
        let context = types::ToolCallContext::new("run", "root", "agent", cancellation);
        let call = ToolCall {
            index: None,
            id: "call_pending".to_string(),
            call_type: "function".to_string(),
            function: FunctionCall {
                name: "pending".to_string(),
                arguments: "{}".to_string(),
            },
        };

        let result = registry.execute(&call, context).await;
        assert_eq!(result.error.as_deref(), Some("tool call cancelled"));
        assert_eq!(result.error_kind, Some(ToolErrorKind::Cancelled));
    }

    #[tokio::test]
    async fn tool_handler_panic_becomes_a_tool_error() {
        let definition = otherone_ai::types::Tool {
            tool_type: "function".to_string(),
            function: otherone_ai::types::FunctionDefinition {
                name: "panic".to_string(),
                description: "panics".to_string(),
                parameters: None,
            },
        };
        let mut registry = ToolRegistry::new();
        registry
            .register(ToolRegistration::sync(definition, |_| -> String {
                panic!("test panic")
            }))
            .unwrap();
        let context = types::ToolCallContext::new(
            "run",
            "root",
            "agent",
            tokio_util::sync::CancellationToken::new(),
        );
        let call = ToolCall {
            index: None,
            id: "call_panic".to_string(),
            call_type: "function".to_string(),
            function: FunctionCall {
                name: "panic".to_string(),
                arguments: "{}".to_string(),
            },
        };

        let result = registry.execute(&call, context).await;
        assert_eq!(result.error.as_deref(), Some("tool handler panicked"));
        assert_eq!(result.error_kind, Some(ToolErrorKind::Fatal));
    }
}

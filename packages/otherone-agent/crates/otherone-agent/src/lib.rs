// 作用：Agent 循环驱动 — 整个框架的核心，驱动 AI 对话流程
// 关联：调用 ai、context、tools、storage 等所有子模块
// 预期结果：根据 input 和 ai 配置，执行完整的 Agent 循环，返回最终响应

pub mod error;
pub mod multi_agent;
pub mod response_parser;
pub mod types;

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Duration;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;
use tracing::warn;

use crate::error::AgentError;
use crate::response_parser::parse_ai_response;
use crate::types::{
    AiOptions, ContextLoadType as AgentContextLoadType, InputOptions,
    StorageType as AgentStorageType,
};
use otherone_ai::error::AiError;
use otherone_storage::types::{StorageType, WriteEntryOptions};

pub use crate::types::{
    AcknowledgedUserMessage, AgentStreamCommand, AgentStreamHandle, MessageResolver,
    MessageResolverFuture, StreamAgentEvent, UserMessageInput,
};
pub use otherone_context::types::PreCompactionMessageHook;

const LONG_TERM_MEMORY_TOOL_NAME: &str = "otherone_add_long_term_memory";
const LONG_TERM_MEMORY_RECALL_TOOL_NAME: &str = "otherone_recall_long_term_memory";
const LONG_TERM_MEMORY_COMMIT_TOOL_NAME: &str = "otherone_commit_long_term_memory";
const DEFAULT_LONG_TERM_MEMORY_RECALL_MAX_TYPES: usize = 5;
const MAX_LONG_TERM_MEMORY_RECALL_MAX_TYPES: usize = 16;
const INITIAL_MODEL_REQUEST_MAX_ATTEMPTS: u32 = 4;
const INITIAL_MODEL_REQUEST_RETRY_BASE_DELAY_MS: u64 = 250;
const EMPTY_MODEL_RESPONSE_MAX_ATTEMPTS: u32 = 2;
const EMPTY_MODEL_RESPONSE_RETRY_DELAY_MS: u64 = 250;
const LONG_TERM_MEMORY_SYSTEM_PROMPT: &str = r#"Long-term memory is enabled.

Evaluate the current user message for reusable long-term information. Reusable information includes stable user preferences, identity facts, durable project rules, long-term goals, recurring habits, and constraints that may help future conversations.

Do not store one-off requests, temporary state, casual filler, reminders, calculations, translation requests, or information that is only useful for the current response.

Do not store secrets, credentials, API keys, passwords, verification codes, payment details, or other highly sensitive data. If the user gives sensitive data, respond normally but do not call the memory tool for that content.

Bias toward calling the memory tool when the user explicitly says information can be remembered long-term, or when the message contains durable identity, preferred name, preferred form of address, default language, stable preference, recurring habit, durable project rule, allergy, or long-term constraint.

When reusable information exists, call `otherone_add_long_term_memory` with:
- `storage`: a concise natural-language memory statement.
- `types`: the specific semantic category for this exact memory node. Prefer concrete categories over broad ones. Do not use a broad parent category when a more specific child category is available.
- `possible_parent_types`: 1-5 short keywords or semantic tags for likely existing parent memory categories. These must be compact category hints, not full sentences. Examples: `food`, `noodles`, `diet preference`, `project rule`, `coding style`.

If you tell the user that you recorded, remembered, saved, or noted durable information, you must have called `otherone_add_long_term_memory` for that information in the same turn. Do not claim durable memory was recorded unless you called the tool.

Examples:
- "My name is Lin Che" -> storage: "用户的称呼是林澈", types: "用户称呼", possible_parent_types: ["身份信息", "称呼", "用户资料"].
- "Call me Jae from now on" -> storage: "用户的称呼是 Jae", types: "用户称呼", possible_parent_types: ["身份信息", "称呼", "用户资料"].
- "Use Chinese by default" -> storage: "与用户交流默认使用中文", types: "交流语言偏好", possible_parent_types: ["沟通偏好", "语言偏好", "对话设置"].
- "I like zhajiangmian" -> storage: "用户喜欢吃炸酱面", types: "用户喜欢吃的面食", possible_parent_types: ["食物偏好", "饮食偏好", "面食偏好"].
- "I like sweet and sour ribs" -> storage: "用户喜欢吃糖醋排骨", types: "用户喜欢吃的菜", possible_parent_types: ["食物偏好", "饮食偏好", "菜肴偏好"].
- "I dislike cilantro" -> storage: "用户不喜欢吃香菜", types: "用户不喜欢的食材", possible_parent_types: ["食物偏好", "饮食偏好", "忌口偏好"].
- "I prefer concise Rust code" -> storage: "用户偏好简洁的 Rust 代码", types: "Rust 代码风格偏好", possible_parent_types: ["编码偏好", "Rust", "代码风格"].

When the current user request could benefit from known long-term information, call `otherone_recall_long_term_memory` before answering. Pass `memory_types` as compact type keywords or semantic tags, such as ["饮食偏好"], ["用户称呼", "语言偏好"], ["Rust 错误处理偏好"], or ["前端设计偏好"].

The recall tool returns only remembered facts, not internal node JSON. Use those facts as background context for the answer.

Call the recall tool at most once per user request unless the first recall clearly misses a separate required topic.

The add-memory tool only queues the memory for later processing and returns immediately. After tools return, continue the normal response. Do not mention memory storage unless the user asks."#;
const LONG_TERM_MEMORY_MODEL_SYSTEM_PROMPT: &str = r#"You are the long-term memory write planner for Otherone.

You receive:
- A candidate memory submitted by the main agent.
- A table of nearby existing memory nodes selected by system search.

The memory tree has a headless point with no semantic content. Its direct children are root points. Deeper nodes must have more specific `types` than their parents.

Your task is to choose the best write operation. Always call `otherone_commit_long_term_memory`. Do not answer in natural language.

Rules:
- If no existing node is semantically relevant, use `insert_root`.
- If an existing node is a good parent and its `types` is already broad enough, use `insert_child`.
- If an existing node should become a broader parent category before inserting the new memory, use `update_parent_and_insert_child`.
- If the candidate duplicates or corrects an existing node, use `update_existing`.
- If the candidate is not reusable long-term information, or contains secrets, credentials, API keys, passwords, verification codes, payment details, temporary state, reminders, one-off requests, calculations, or casual filler, use `ignore`.
- Do not ignore durable identity, preferred name, preferred form of address, default communication language, stable design/coding/work preference, project rule, diet constraint, allergy, recurring habit, or long-term user constraint.
- If the candidate is a sibling of an existing specific memory, do not simply attach it under that specific memory. Use `update_parent_and_insert_child` to broaden the existing node's `storage` and `types`, then insert the candidate as a more specific child.
- A parent node's `storage` must make sense as a parent summary for all of its children. If the parent storage only describes one specific item, broaden it before adding a sibling child.
- Keep `storage` as a concise reusable fact.
- Keep `types` specific for the inserted or updated node. Parent `types` may become broader only when needed to cover both the old and new child concepts.

Canonical example:
- Existing node: point_id="p1", storage="用户喜欢吃炸酱面", types="用户喜欢的面食".
- Candidate: storage="用户喜欢吃糖醋排骨", types="用户喜欢的菜肴".
- Correct action: `update_parent_and_insert_child`.
- Correct parent update: parent_id="p1", parent_storage="用户喜欢吃炸酱面和糖醋排骨等食物", parent_types="用户喜欢的食物".
- Correct inserted child: storage="用户喜欢吃糖醋排骨", types="用户喜欢的菜肴".

Canonical language example:
- Existing candidates may be unrelated.
- Candidate: storage="与用户交流默认使用中文", types="交流语言偏好".
- Correct action: `insert_root`, unless an existing communication preference node should be updated.

Canonical food restriction example:
- Existing node may describe liked foods.
- Candidate: storage="用户不喜欢吃香菜", types="用户不喜欢的食材".
- Correct action: store it. Use `update_parent_and_insert_child` if a food preference parent should broaden into food preferences and restrictions, otherwise use `insert_root`. Do not ignore stable dislikes or diet restrictions."#;

const LONG_TERM_MEMORY_FALLBACK_TYPES: &str = "待分类长期记忆";

type LongTermMemoryQueue = Arc<Mutex<Vec<PendingLongTermMemory>>>;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
struct PendingLongTermMemory {
    storage: String,
    types: String,
    #[serde(default)]
    possible_parent_types: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
struct LongTermMemoryRecallArgs {
    #[serde(default)]
    memory_types: Vec<String>,
}

#[derive(Debug, Clone)]
struct MemoryModelConfig {
    provider: otherone_ai::types::ProviderType,
    api_key: String,
    base_url: String,
    model: String,
    context_length: Option<u32>,
    temperature: Option<f32>,
    top_p: Option<f32>,
    other: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
struct LongTermMemoryCommitArgs {
    action: String,
    storage: Option<String>,
    types: Option<String>,
    parent_id: Option<String>,
    target_id: Option<String>,
    parent_storage: Option<String>,
    parent_types: Option<String>,
}

/// 流式 Agent 调用
/// 作用：启动流式 Agent 循环，通过 mpsc channel 实时发送事件
/// 关联：被 otherone 主 crate 的 Otherone::invoke_agent_stream 调用
/// 预期结果：返回 mpsc Receiver，调用者可以异步迭代接收事件
pub async fn invoke_agent_stream(
    input: InputOptions,
    ai: AiOptions,
    auxiliary_ai: Option<AiOptions>,
) -> Result<mpsc::Receiver<StreamAgentEvent>, AgentError> {
    let mut handle = invoke_agent_stream_interactive(input, ai, auxiliary_ai).await?;
    let (tx, rx) = mpsc::channel(256);
    tokio::spawn(async move {
        loop {
            tokio::select! {
                biased;
                _ = tx.closed() => {
                    handle.cancel();
                    let _ = handle.wait().await;
                    break;
                }
                event = handle.recv() => {
                    let Some(event) = event else {
                        let _ = handle.wait().await;
                        break;
                    };
                    if tx.send(event).await.is_err() {
                        handle.cancel();
                        let _ = handle.wait().await;
                        break;
                    }
                }
            }
        }
    });
    Ok(rx)
}

/// 可交互的流式 Agent 调用
/// 作用：启动流式 Agent 循环，并返回事件接收器和运行中命令发送器
pub async fn invoke_agent_stream_interactive(
    input: InputOptions,
    ai: AiOptions,
    auxiliary_ai: Option<AiOptions>,
) -> Result<AgentStreamHandle, AgentError> {
    invoke_agent_stream_interactive_with_cancellation(
        input,
        ai,
        auxiliary_ai,
        CancellationToken::new(),
    )
    .await
}

/// Starts an interactive legacy run bound to the caller's cancellation tree.
pub async fn invoke_agent_stream_interactive_with_cancellation(
    input: InputOptions,
    ai: AiOptions,
    auxiliary_ai: Option<AiOptions>,
    cancellation: CancellationToken,
) -> Result<AgentStreamHandle, AgentError> {
    invoke_agent_stream_interactive_with_cancellation_and_pre_compaction_hook(
        input,
        ai,
        auxiliary_ai,
        cancellation,
        None,
    )
    .await
}

pub async fn invoke_agent_stream_interactive_with_cancellation_and_pre_compaction_hook(
    input: InputOptions,
    mut ai: AiOptions,
    auxiliary_ai: Option<AiOptions>,
    cancellation: CancellationToken,
    pre_compaction_hook: Option<PreCompactionMessageHook>,
) -> Result<AgentStreamHandle, AgentError> {
    let (tx, rx) = mpsc::channel::<StreamAgentEvent>(256);
    let (command_tx, command_rx) = mpsc::channel::<AgentStreamCommand>(256);
    let task_cancellation = cancellation.clone();

    let task = tokio::spawn(async move {
        let mut auxiliary_ai = auxiliary_ai;
        match run_stream_loop(
            input,
            &mut ai,
            auxiliary_ai.as_mut(),
            &tx,
            command_rx,
            &task_cancellation,
            pre_compaction_hook,
        )
        .await
        {
            Ok(()) => {}
            Err(AgentError::Cancelled) => {
                let _ = tx
                    .send(StreamAgentEvent {
                        event_type: "cancelled".to_string(),
                        content: String::new(),
                        raw_chunk: None,
                        error: Some(AgentError::Cancelled.to_string()),
                    })
                    .await;
            }
            Err(error) => {
                let _ = tx
                    .send(StreamAgentEvent {
                        event_type: "error".to_string(),
                        content: format!("[error:{error}]"),
                        raw_chunk: None,
                        error: Some(error.to_string()),
                    })
                    .await;
            }
        }
    });

    Ok(AgentStreamHandle::new(rx, command_tx, cancellation, task))
}

struct QueuedUserMessage {
    message: UserMessageInput,
    persisted: Option<tokio::sync::oneshot::Sender<()>>,
}

impl QueuedUserMessage {
    fn unacknowledged(message: UserMessageInput) -> Self {
        Self {
            message,
            persisted: None,
        }
    }

    fn acknowledged(message: AcknowledgedUserMessage) -> Self {
        Self {
            message: message.message,
            persisted: Some(message.persisted),
        }
    }
}

fn drain_agent_commands(
    command_rx: &mut mpsc::Receiver<AgentStreamCommand>,
    queued_messages: &mut VecDeque<QueuedUserMessage>,
) {
    loop {
        match command_rx.try_recv() {
            Ok(AgentStreamCommand::EnqueueUserPrompts(prompts)) => {
                for prompt in prompts {
                    let prompt = prompt.trim();
                    if !prompt.is_empty() {
                        queued_messages.push_back(QueuedUserMessage::unacknowledged(
                            UserMessageInput::text(prompt),
                        ));
                    }
                }
            }
            Ok(AgentStreamCommand::EnqueueUserMessages(messages)) => {
                queued_messages.extend(
                    messages
                        .into_iter()
                        .filter(|message| !message.is_effectively_empty())
                        .map(QueuedUserMessage::unacknowledged),
                );
            }
            Ok(AgentStreamCommand::EnqueueUserMessagesWithAck(messages)) => {
                for message in messages {
                    if !message.message.is_effectively_empty() {
                        queued_messages.push_back(QueuedUserMessage::acknowledged(message));
                    }
                }
            }
            Err(mpsc::error::TryRecvError::Empty)
            | Err(mpsc::error::TryRecvError::Disconnected) => break,
        }
    }
}

fn user_message_metadata(
    message: &UserMessageInput,
) -> Result<otherone_storage::types::AttributeBag, AgentError> {
    let mut metadata = message.metadata.clone();
    let content = serde_json::to_value(&message.message_content)
        .map_err(|error| AgentError::ContextError(error.to_string()))?;
    metadata.insert(
        otherone_storage::types::MESSAGE_CONTENT_METADATA_KEY.to_string(),
        content,
    );
    Ok(metadata)
}

async fn write_user_message_entry(
    input: &InputOptions,
    storage_type: &StorageType,
    message: &UserMessageInput,
) -> Result<(), AgentError> {
    otherone_storage::write_entry(&WriteEntryOptions {
        storage_type: storage_type.clone(),
        session_id: input.session_id.clone(),
        role: "user".to_string(),
        content: message.display_content.clone(),
        tools: None,
        token_consumption: None,
        create_at: None,
        database_config: input.database_config.clone(),
        runtime_context: input.runtime_context.clone(),
        metadata: user_message_metadata(message)?,
    })
    .await
    .map_err(|e| AgentError::ContextError(e.to_string()))
}

async fn write_queued_user_messages(
    input: &InputOptions,
    storage_type: &StorageType,
    queued_messages: &mut VecDeque<QueuedUserMessage>,
) -> Result<usize, AgentError> {
    write_queued_user_messages_with(queued_messages, |message| async move {
        write_user_message_entry(input, storage_type, &message).await
    })
    .await
}

async fn write_queued_user_messages_with<F, Fut>(
    queued_messages: &mut VecDeque<QueuedUserMessage>,
    mut write: F,
) -> Result<usize, AgentError>
where
    F: FnMut(UserMessageInput) -> Fut,
    Fut: std::future::Future<Output = Result<(), AgentError>>,
{
    let mut written = 0usize;

    while let Some(message) = queued_messages.front().map(|queued| queued.message.clone()) {
        write(message).await?;
        if let Some(queued) = queued_messages.pop_front() {
            if let Some(persisted) = queued.persisted {
                let _ = persisted.send(());
            }
        }
        written += 1;
    }

    Ok(written)
}

fn initial_user_message(ai: &AiOptions) -> Option<UserMessageInput> {
    ai.user_message
        .clone()
        .or_else(|| ai.user_prompt.as_ref().map(UserMessageInput::text))
}

fn initial_user_display_content(ai: &AiOptions) -> Option<&str> {
    ai.user_message
        .as_ref()
        .map(|message| message.display_content.as_str())
        .or(ai.user_prompt.as_deref())
}

fn latest_user_display_content(messages: &[otherone_ai::types::Message]) -> Option<String> {
    messages
        .iter()
        .rev()
        .find(|message| message.role.eq_ignore_ascii_case("user"))
        .and_then(|message| match &message.content {
            otherone_ai::types::MessageContent::Text(content) => {
                (!content.trim().is_empty()).then(|| content.clone())
            }
            otherone_ai::types::MessageContent::MultiPart(parts) => parts.iter().find_map(|part| {
                part.text
                    .as_ref()
                    .filter(|text| !text.trim().is_empty())
                    .cloned()
            }),
        })
}

async fn resolve_messages_for_model(
    ai: &AiOptions,
    messages: Vec<otherone_ai::types::Message>,
) -> Result<Vec<otherone_ai::types::Message>, AgentError> {
    match &ai.message_resolver {
        Some(resolver) => resolver
            .resolve_messages(messages)
            .await
            .map_err(AgentError::MessageResolution),
        None => Ok(messages),
    }
}

fn retryable_initial_model_error(error: &AiError) -> bool {
    match error {
        AiError::HttpError(error) => {
            !error.is_builder()
                && (error.is_timeout()
                    || error.is_connect()
                    || error.is_request()
                    || error.is_body())
        }
        AiError::ApiError { status, .. } => {
            matches!(*status, 408 | 425 | 429) || (500..=599).contains(status)
        }
        _ => false,
    }
}

fn initial_model_retry_delay(attempt: u32) -> Duration {
    let exponent = attempt.saturating_sub(1).min(3);
    Duration::from_millis(
        INITIAL_MODEL_REQUEST_RETRY_BASE_DELAY_MS.saturating_mul(1_u64 << exponent),
    )
}

async fn invoke_model_stream_with_initial_retry(
    ai: &AiOptions,
    config: serde_json::Value,
    cancellation: &CancellationToken,
) -> Result<otherone_ai::traits::ModelEventStream, AgentError> {
    use futures::StreamExt;
    if let Some(executor) = &ai.model_executor {
        return tokio::select! {
            biased;
            _ = cancellation.cancelled() => Err(AgentError::Cancelled),
            result = executor.stream(config) => result.map_err(AgentError::AiError),
        };
    }
    for attempt in 1..=INITIAL_MODEL_REQUEST_MAX_ATTEMPTS {
        let result = tokio::select! {
            biased;
            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
            result = invoke_model_as_stream(ai, config.clone()) => result,
        };

        match result {
            Ok(stream) => return Ok(Box::pin(stream.map(|chunk| chunk.map(otherone_ai::traits::ModelEvent::Chunk)))),
            Err(error)
                if attempt < INITIAL_MODEL_REQUEST_MAX_ATTEMPTS
                    && retryable_initial_model_error(&error) =>
            {
                let delay = initial_model_retry_delay(attempt);
                warn!(
                    attempt,
                    max_attempts = INITIAL_MODEL_REQUEST_MAX_ATTEMPTS,
                    delay_ms = delay.as_millis(),
                    error = %error,
                    "initial model stream request failed; retrying"
                );
                tokio::select! {
                    biased;
                    _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
                    _ = tokio::time::sleep(delay) => {}
                }
            }
            Err(error) => return Err(AgentError::AiError(error)),
        }
    }

    unreachable!("the bounded initial model request loop always returns")
}

async fn invoke_model_as_stream(
    ai: &AiOptions,
    config: serde_json::Value,
) -> Result<otherone_ai::traits::ChatStream, AiError> {
    if config.get("stream").and_then(serde_json::Value::as_bool) == Some(false) {
        let state = NonStreamingRetryState {
            provider: ai.provider.clone(),
            api_key: ai.api_key.clone(),
            base_url: ai.base_url.clone(),
            config,
            response_attempt: 0,
            finished: false,
        };
        return Ok(Box::pin(futures::stream::unfold(
            state,
            |mut state| async move {
                if state.finished {
                    return None;
                }
                if state.response_attempt > 0 {
                    tokio::time::sleep(Duration::from_millis(EMPTY_MODEL_RESPONSE_RETRY_DELAY_MS))
                        .await;
                }

                let result = invoke_non_streaming_model_with_initial_retry(
                    state.provider.clone(),
                    &state.api_key,
                    &state.base_url,
                    state.config.clone(),
                )
                .await;
                state.response_attempt += 1;
                match &result {
                    Ok(response)
                        if empty_model_completion(response)
                            && state.response_attempt < EMPTY_MODEL_RESPONSE_MAX_ATTEMPTS =>
                    {
                        warn!(
                            attempt = state.response_attempt,
                            max_attempts = EMPTY_MODEL_RESPONSE_MAX_ATTEMPTS,
                            "model returned an empty completion without tool calls; retrying"
                        );
                    }
                    _ => state.finished = true,
                }
                Some((result, state))
            },
        )));
    }

    otherone_ai::invoke_model_stream(ai.provider.clone(), &ai.api_key, &ai.base_url, config).await
}

struct NonStreamingRetryState {
    provider: otherone_ai::types::ProviderType,
    api_key: String,
    base_url: String,
    config: serde_json::Value,
    response_attempt: u32,
    finished: bool,
}

fn empty_model_completion(response: &otherone_ai::types::ChatResponse) -> bool {
    response.choices.first().is_none_or(|choice| {
        choice.message.as_ref().is_none_or(|message| {
            message
                .content
                .as_deref()
                .is_none_or(|content| content.trim().is_empty())
                && message
                    .tool_calls
                    .as_ref()
                    .is_none_or(|tool_calls| tool_calls.is_empty())
        })
    })
}

async fn invoke_non_streaming_model_with_initial_retry(
    provider: otherone_ai::types::ProviderType,
    api_key: &str,
    base_url: &str,
    config: serde_json::Value,
) -> Result<otherone_ai::types::ChatResponse, AiError> {
    for attempt in 1..=INITIAL_MODEL_REQUEST_MAX_ATTEMPTS {
        match otherone_ai::invoke_model(provider.clone(), api_key, base_url, config.clone()).await {
            Ok(response) => return Ok(response),
            Err(error)
                if attempt < INITIAL_MODEL_REQUEST_MAX_ATTEMPTS
                    && retryable_initial_model_error(&error) =>
            {
                let delay = initial_model_retry_delay(attempt);
                warn!(
                    attempt,
                    max_attempts = INITIAL_MODEL_REQUEST_MAX_ATTEMPTS,
                    delay_ms = delay.as_millis(),
                    error = %error,
                    "initial non-streaming model request failed; retrying"
                );
                tokio::time::sleep(delay).await;
            }
            Err(error) => return Err(error),
        }
    }

    unreachable!("the bounded initial non-streaming model request loop always returns")
}

async fn emit_queued_user_prompts(tx: &mpsc::Sender<StreamAgentEvent>, count: usize) {
    if count == 0 {
        return;
    }

    let _ = tx
        .send(StreamAgentEvent {
            event_type: "queued_user_prompts".to_string(),
            content: count.to_string(),
            raw_chunk: None,
            error: None,
        })
        .await;
}

#[derive(Debug)]
struct RequiredTerminalToolGuard {
    name: Option<String>,
    forced_attempted: bool,
    completed: bool,
}

impl RequiredTerminalToolGuard {
    fn from_ai(ai: &AiOptions) -> Result<Self, AgentError> {
        let name = ai
            .required_terminal_tool
            .as_deref()
            .map(str::trim)
            .filter(|name| !name.is_empty())
            .map(str::to_string);

        if let Some(required) = name.as_deref() {
            let declared = ai.tools.as_ref().is_some_and(|tools| {
                tools
                    .iter()
                    .any(|tool| tool.function.name.as_str() == required)
            });
            let realized = ai
                .tools_realize
                .as_ref()
                .is_some_and(|realizations| realizations.contains_key(required));
            if !declared || !realized {
                return Err(AgentError::RequiredTerminalTool(format!(
                    "'{required}' must be present in both tools and tools_realize"
                )));
            }
        }

        Ok(Self {
            name,
            forced_attempted: false,
            completed: false,
        })
    }

    fn validate_tool_calls(
        &self,
        tool_calls: &[otherone_ai::types::ToolCall],
    ) -> Result<(), AgentError> {
        let Some(required) = self.name.as_deref() else {
            return Ok(());
        };
        if self.completed {
            return Err(AgentError::RequiredTerminalTool(format!(
                "provider returned another tool call after '{required}' completed"
            )));
        }

        let required_count = tool_calls
            .iter()
            .filter(|call| call.function.name == required)
            .count();
        if required_count > 0 && (required_count != 1 || tool_calls.len() != 1) {
            return Err(AgentError::RequiredTerminalTool(format!(
                "'{required}' must be the only tool call in its terminal iteration"
            )));
        }
        if self.forced_attempted && required_count == 0 {
            return Err(AgentError::RequiredTerminalTool(format!(
                "provider ignored the forced '{required}' tool choice"
            )));
        }
        Ok(())
    }

    fn record_tool_results(
        &mut self,
        tool_results: &[otherone_tools::types::ToolResult],
        ai: &mut AiOptions,
    ) -> Result<(), AgentError> {
        let Some(required) = self.name.as_deref() else {
            return Ok(());
        };
        let Some(result) = tool_results
            .iter()
            .find(|result| result.function_name == required)
        else {
            return Ok(());
        };
        if let Some(error) = result.error.as_deref() {
            return Err(AgentError::RequiredTerminalTool(format!(
                "'{required}' execution failed: {error}"
            )));
        }
        if tool_result_contains_embedded_error(result) {
            return Ok(());
        }

        self.completed = true;
        ai.tool_choice = Some(otherone_ai::types::ToolChoice::String("none".to_string()));
        Ok(())
    }

    fn prepare_completion(&mut self, ai: &mut AiOptions) -> Result<bool, AgentError> {
        let Some(required) = self.name.as_deref() else {
            return Ok(false);
        };
        if self.completed {
            return Ok(false);
        }
        if self.forced_attempted {
            return Err(AgentError::RequiredTerminalTool(format!(
                "provider did not call forced tool '{required}'"
            )));
        }

        self.forced_attempted = true;
        ai.tool_choice = Some(otherone_ai::types::ToolChoice::function(required));
        Ok(true)
    }

    fn name(&self) -> Option<&str> {
        self.name.as_deref()
    }
}

fn tool_result_contains_embedded_error(result: &otherone_tools::types::ToolResult) -> bool {
    let Some(value) = result.result.as_ref() else {
        return false;
    };
    let parsed;
    let value = match value {
        serde_json::Value::String(text) => {
            let Ok(decoded) = serde_json::from_str::<serde_json::Value>(text) else {
                return false;
            };
            parsed = decoded;
            &parsed
        }
        value => value,
    };
    value.get("error").is_some_and(|error| !error.is_null())
}

fn rejected_user_input_batch(ai: &AiOptions, calls: &[otherone_ai::types::ToolCall]) -> Option<Vec<otherone_tools::types::ToolResult>> {
    if ai.tool_registry.is_some() { return None; }
    let name = ai.user_input_tool.as_deref()?;
    if calls.len() == 1 || !calls.iter().any(|call| call.function.name == name) {
        return None;
    }
    let error = format!("'{name}' must be the only tool in a user-input batch. No tools in this batch were executed.");
    Some(calls.iter().map(|call| otherone_tools::types::ToolResult {
        tool_call_id: call.id.clone(),
        function_name: call.function.name.clone(),
        result: Some(serde_json::json!({
            "status": "failed", "error": error,
            "retry": format!("Call {name} alone, or call the other tools without {name}.")
        })),
        error: Some(error.clone()),
        error_kind: Some(otherone_tools::types::ToolErrorKind::InvalidArguments),
    }).collect())
}

fn user_input_receipt(ai: &AiOptions, result: &otherone_tools::types::ToolResult) -> Option<serde_json::Value> {
    let name = ai.user_input_tool.as_deref()?;
    if result.function_name != name || result.error.is_some() || tool_result_contains_embedded_error(result) {
        return None;
    }
    let value = match result.result.as_ref()? {
        serde_json::Value::String(text) => serde_json::from_str::<serde_json::Value>(text).ok()?,
        value => value.clone(),
    };
    (value.is_object() && value["status"] == "awaiting_user").then_some(value)
}

fn requested_user_input(ai: &AiOptions, results: &[otherone_tools::types::ToolResult]) -> bool {
    results.iter().any(|result| user_input_receipt(ai, result).is_some() || (ai.terminal_tools.contains(&result.function_name) && !tool_result_contains_embedded_error(result) && result.result.as_ref().and_then(|value| match value { serde_json::Value::String(text) => serde_json::from_str::<serde_json::Value>(text).ok(), value => Some(value.clone()) }).is_some_and(|value| value["committed"] == true)))
}

async fn execute_registered_tools(ai: &AiOptions, input: &InputOptions, calls: &[otherone_ai::types::ToolCall], legacy: &otherone_tools::ToolRealizationMap, cancellation: &CancellationToken) -> Result<Vec<otherone_tools::types::ToolResult>, AgentError> {
    match &ai.tool_registry {
        Some(registry) => otherone_tools::process_tools_async(calls, registry, otherone_tools::types::ToolCallContext::new(&input.session_id, &input.session_id, "doe", cancellation.clone())).await.map_err(|error| AgentError::ToolError(error.to_string())),
        None => otherone_tools::process_tools(calls, legacy).map_err(AgentError::ToolError),
    }
}

/// 流式循环实际逻辑
/// 作用：在后台 task 中执行完整的流式 Agent 循环
/// 关联：被 invoke_agent_stream 调用
/// 预期结果：通过 tx channel 发送所有事件，循环结束后返回
async fn run_stream_loop(
    input: InputOptions,
    ai: &mut AiOptions,
    auxiliary_ai: Option<&mut AiOptions>,
    tx: &mpsc::Sender<StreamAgentEvent>,
    mut command_rx: mpsc::Receiver<AgentStreamCommand>,
    cancellation: &CancellationToken,
    pre_compaction_hook: Option<PreCompactionMessageHook>,
) -> Result<(), AgentError> {
    ensure_not_cancelled(cancellation)?;
    let mut required_terminal_tool = RequiredTerminalToolGuard::from_ai(ai)?;
    let long_term_memory_enabled = input.enable_long_term_memory.unwrap_or(false);
    let memory_queue = if long_term_memory_enabled {
        Some(Arc::new(Mutex::new(Vec::new())))
    } else {
        None
    };
    let memory_model_config = if long_term_memory_enabled {
        let model_source = auxiliary_ai.as_ref().map(|aux| &**aux).unwrap_or(ai);
        Some(MemoryModelConfig::from_ai(model_source))
    } else {
        None
    };
    let long_term_memory_recall_max_types =
        normalize_recall_max_types(input.long_term_memory_recall_max_types);

    if let Some(queue) = &memory_queue {
        configure_long_term_memory(ai, Arc::clone(queue), long_term_memory_recall_max_types);
    }

    let storage_type: StorageType = match &input.storage_type {
        Some(AgentStorageType::LocalFile) => StorageType::LocalFile,
        Some(AgentStorageType::Database) => StorageType::Database,
        None => StorageType::LocalFile,
    };

    // 存储用户消息
    if let Some(message) = initial_user_message(ai) {
        tokio::select! {
            biased;
            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
            result = write_user_message_entry(&input, &storage_type, &message) => result?,
        }
    }

    let max_iterations = input.max_iterations.unwrap_or(999999);
    let mut iteration: u32 = 0;
    let mut long_term_memory_activity = false;
    let mut queued_messages = VecDeque::new();
    let mut memory_fallback_prompt = initial_user_display_content(ai).map(ToString::to_string);

    while iteration < max_iterations {
        ensure_not_cancelled(cancellation)?;
        iteration += 1;

        drain_agent_commands(&mut command_rx, &mut queued_messages);
        let written = tokio::select! {
            biased;
            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
            result = write_queued_user_messages(&input, &storage_type, &mut queued_messages) => result?,
        };
        emit_queued_user_prompts(tx, written).await;

        // 组合 tools 配置
        let tools = otherone_tools::combine_tools(ai.tools.clone());
        ai.tools = tools;

        // 加载上下文
        let context_load_type = match &input.context_load_type {
            AgentContextLoadType::LocalFile => otherone_context::types::ContextLoadType::LocalFile,
            AgentContextLoadType::Database => otherone_context::types::ContextLoadType::Database,
        };

        let context_options = otherone_context::types::CombineContextOptions {
            session_id: input.session_id.clone(),
            load_type: context_load_type,
            provider: ai.provider.clone(),
            context_window: input.context_window,
            threshold_percentage: input.threshold_percentage,
            ai: ai.other.clone(),
            system_prompt: ai.system_prompt.clone(),
            tools: ai.tools.clone(),
            database_config: input.database_config.clone(),
            runtime_context: input.runtime_context.clone(),
            compact_executor: ai.compact_executor.clone(),
        };
        let messages = tokio::select! {
            biased;
            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
            result = otherone_context::combine_context_with_pre_compaction_hook(
                &context_options,
                pre_compaction_hook.as_ref(),
            ) => {
                result.map_err(|e| AgentError::ContextError(e.to_string()))?
            },
        };
        if let Some(prompt) = latest_user_display_content(&messages) {
            memory_fallback_prompt = Some(prompt);
        }

        // 构建 AI 配置，强制流式
        let messages = tokio::select! {
            biased;
            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
            result = resolve_messages_for_model(ai, messages) => result?,
        };
        let mut ai_config = build_ai_config(ai, &messages);
        ai_config["stream"] = serde_json::json!(ai.stream.unwrap_or(true));

        // 调用流式 AI 模型
        let mut stream =
            invoke_model_stream_with_initial_retry(ai, ai_config, cancellation).await?;

        // 累积变量
        let mut full_content = String::new();
        let mut reasoning_content = String::new();
        let mut role = "assistant".to_string();
        let mut stream_tool_calls: Vec<otherone_ai::types::ToolCall> = Vec::new();
        let mut token_consumption: u32 = 0;
        let mut stream_has_terminal_boundary = false;

        // 遍历流，实时发送给调用者
        use futures::StreamExt;
        loop {
            let chunk_result = tokio::select! {
                biased;
                _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
                result = stream.next() => result,
            };
            let Some(chunk_result) = chunk_result else {
                break;
            };
            let chunk = match chunk_result {
                Ok(otherone_ai::traits::ModelEvent::Chunk(c)) => c,
                Ok(otherone_ai::traits::ModelEvent::Attempt(attempt)) => {
                    if let Some(observer) = &ai.raw_chunk_observer {
                        observer.reset_model_attempt().await.map_err(AgentError::ModelResponseObservation)?;
                    }
                    full_content.clear();
                    reasoning_content.clear();
                    role = "assistant".to_string();
                    stream_tool_calls.clear();
                    token_consumption = 0;
                    stream_has_terminal_boundary = false;
                    let _ = tx.send(StreamAgentEvent {
                        event_type: "model_attempt".into(), content: String::new(),
                        raw_chunk: Some(serde_json::to_value(attempt).unwrap_or_default()), error: None,
                    }).await;
                    continue;
                }
                Err(e) => return Err(AgentError::AiError(e)),
            };
            stream_has_terminal_boundary |= stream_chunk_has_terminal_boundary(&chunk);

            // 发送原始 chunk
            let raw_json = serde_json::to_value(&chunk).unwrap_or_default();
            if let Some(observer) = &ai.raw_chunk_observer {
                observer
                    .observe_raw_chunk(raw_json.clone())
                    .await
                    .map_err(AgentError::ModelResponseObservation)?;
            }
            tokio::select! {
                biased;
                _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
                _ = tx.send(StreamAgentEvent {
                    event_type: "chunk".to_string(),
                    content: String::new(),
                    raw_chunk: Some(raw_json),
                    error: None,
                }) => {}
            }

            // 提取 delta 信息
            if let Some(choice) = chunk.choices.first() {
                if let Some(ref delta) = choice.delta {
                    if let Some(value) = &delta.reasoning_content { reasoning_content.push_str(value); }
                    if let Some(ref r) = delta.role {
                        role = r.clone();
                    }
                    if let Some(ref c) = delta.content {
                        full_content.push_str(c);
                    }
                    if let Some(thinking) = delta_thinking_content(delta) {
                        tokio::select! {
                            biased;
                            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
                            _ = tx.send(StreamAgentEvent {
                                event_type: "thinking".to_string(),
                                content: thinking.to_string(),
                                raw_chunk: None,
                                error: None,
                            }) => {}
                        }
                    }
                }

                if let Some(ref delta) = choice.delta {
                    // 累积 tool_calls
                    if let Some(ref tc) = delta.tool_calls {
                        for tool_call in tc {
                            // 按 index 或 id 匹配合并
                            merge_tool_call_delta(&mut stream_tool_calls, tool_call);
                        }
                    }
                }

                if let Some(ref message) = choice.message {
                    if let Some(value) = &message.reasoning_content { reasoning_content = value.clone(); }
                    if let Some(ref message_role) = message.role {
                        role = message_role.clone();
                    }
                    if let Some(ref message_content) = message.content {
                        full_content.push_str(message_content);
                    }
                    if let Some(thinking) = message_thinking_content(message) {
                        tokio::select! {
                            biased;
                            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
                            _ = tx.send(StreamAgentEvent {
                                event_type: "thinking".to_string(),
                                content: thinking.to_string(),
                                raw_chunk: None,
                                error: None,
                            }) => {}
                        }
                    }
                    if let Some(ref message_tool_calls) = message.tool_calls {
                        stream_tool_calls.extend(message_tool_calls.iter().cloned());
                    }
                }
            }
            if let Some(ref usage) = chunk.usage {
                token_consumption =
                    token_consumption.saturating_add(usage.total_tokens.unwrap_or(0));
            }
            if chunk.choices.iter().any(|choice| choice.finish_reason.is_some()) { break; }
        }

        if !stream_has_terminal_boundary {
            return Err(AgentError::AiError(AiError::StreamError(
                "AI response stream ended before a terminal chunk.".to_string(),
            )));
        }

        // 流结束，构建完整响应
        let tools_wrapper = if stream_tool_calls.is_empty() {
            None
        } else {
            Some(otherone_ai::types::ToolCallsWrapper {
                tool_calls: stream_tool_calls.clone(),
            })
        };

        // 存储 AI 响应
        let assistant_entry = WriteEntryOptions {
            storage_type: storage_type.clone(),
            session_id: input.session_id.clone(),
            role: role.clone(),
            content: full_content.clone(),
            tools: tools_wrapper
                .as_ref()
                .map(|tw| serde_json::json!({ "tool_calls": tw.tool_calls })),
            token_consumption: Some(token_consumption),
            create_at: None,
            database_config: input.database_config.clone(),
            runtime_context: input.runtime_context.clone(),
            metadata: if reasoning_content.is_empty() { Default::default() } else { [("otherone_reasoning_content".into(), serde_json::json!(reasoning_content))].into_iter().collect() },
        };
        tokio::select! {
            biased;
            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
            result = otherone_storage::write_entry(&assistant_entry) => {
                result.map_err(|e| AgentError::ContextError(e.to_string()))?
            },
        }

        // 检查是否有 tool 调用
        if let Some(ref tw) = tools_wrapper {
            if !tw.tool_calls.is_empty() {
                required_terminal_tool.validate_tool_calls(&tw.tool_calls)?;
                if tw
                    .tool_calls
                    .iter()
                    .any(|tool_call| tool_call.function.name == LONG_TERM_MEMORY_TOOL_NAME)
                {
                    long_term_memory_activity = true;
                }

                let tool_calls_info: Vec<String> = tw
                    .tool_calls
                    .iter()
                    .map(|tc| format!("{}({})", tc.function.name, tc.function.arguments))
                    .collect();

                tokio::select! {
                    biased;
                    _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
                    _ = tx.send(StreamAgentEvent {
                        event_type: "tool_calls".to_string(),
                        content: format!("[tool_calls:{}]", tool_calls_info.join(", ")),
                        raw_chunk: None,
                        error: None,
                    }) => {}
                }

                // 处理 tool 调用
                let default_tools_realize = otherone_tools::ToolRealizationMap::new();
                let tools_realize = ai.tools_realize.as_ref().unwrap_or(&default_tools_realize);

                let tool_results = match rejected_user_input_batch(ai, &tw.tool_calls) {
                    Some(results) => results,
                    None => execute_registered_tools(ai, &input, &tw.tool_calls, tools_realize, cancellation).await?,
                };
                ensure_not_cancelled(cancellation)?;
                required_terminal_tool.record_tool_results(&tool_results, ai)?;

                for tool_result in &tool_results {
                    let tool_content = serde_json::to_string(
                        tool_result
                            .result
                            .as_ref()
                            .unwrap_or(&serde_json::Value::Null),
                    )
                    .unwrap_or_default();

                    let tools_value = serde_json::json!({
                        "tool_call_id": tool_result.tool_call_id,
                        "function_name": tool_result.function_name,
                        "result": tool_result.result,
                        "error": tool_result.error,
                    });

                    let tool_entry = WriteEntryOptions {
                        storage_type: storage_type.clone(),
                        session_id: input.session_id.clone(),
                        role: "tool".to_string(),
                        content: tool_content,
                        tools: Some(tools_value),
                        token_consumption: None,
                        create_at: None,
                        database_config: input.database_config.clone(),
                        runtime_context: input.runtime_context.clone(),
                        metadata: Default::default(),
                    };
                    tokio::select! {
                        biased;
                        _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
                        result = otherone_storage::write_entry(&tool_entry) => {
                            result.map_err(|e| AgentError::ContextError(e.to_string()))?
                        },
                    }
                    if let Some(receipt) = user_input_receipt(ai, tool_result) {
                        tokio::select! {
                            biased;
                            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
                            _ = tx.send(StreamAgentEvent {
                                event_type: "user_input_requested".into(), content: String::new(),
                                raw_chunk: Some(serde_json::json!({
                                    "toolName": tool_result.function_name,
                                    "toolCallId": tool_result.tool_call_id,
                                    "result": receipt,
                                })),
                                error: None,
                            }) => {}
                        }
                    }
                }

                spawn_drained_long_term_memory_processing(
                    &memory_queue,
                    &memory_model_config,
                    cancellation.clone(),
                );

                drain_agent_commands(&mut command_rx, &mut queued_messages);
                let written = tokio::select! {
                    biased;
                    _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
                    result = write_queued_user_messages(&input, &storage_type, &mut queued_messages) => result?,
                };
                emit_queued_user_prompts(tx, written).await;

                // The host opted this tool into interaction. Its receipt is now
                // durable; do not spend another model request inventing a reply.
                // A queued real user message instead continues this same run.
                if written == 0 && requested_user_input(ai, &tool_results) {
                    ensure_not_cancelled(cancellation)?;
                    let _ = tx.send(StreamAgentEvent {
                        event_type: "complete".into(), content: full_content,
                        raw_chunk: None, error: None,
                    }).await;
                    return Ok(());
                }

                continue;
            }
        }

        drain_agent_commands(&mut command_rx, &mut queued_messages);
        let written = tokio::select! {
            biased;
            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
            result = write_queued_user_messages(&input, &storage_type, &mut queued_messages) => result?,
        };
        if written > 0 {
            emit_queued_user_prompts(tx, written).await;
            continue;
        }

        if required_terminal_tool.prepare_completion(ai)? {
            let tool_name = required_terminal_tool
                .name()
                .unwrap_or_default()
                .to_string();
            tokio::select! {
                biased;
                _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
                _ = tx.send(StreamAgentEvent {
                    event_type: "required_tool_retry".to_string(),
                    content: tool_name,
                    raw_chunk: None,
                    error: None,
                }) => {}
            }
            continue;
        }

        // 发送完成事件
        spawn_long_term_memory_heuristic_fallback(
            &memory_model_config,
            memory_fallback_prompt.as_deref(),
            long_term_memory_activity,
            cancellation.clone(),
        );

        ensure_not_cancelled(cancellation)?;
        tokio::select! {
            biased;
            _ = cancellation.cancelled() => return Err(AgentError::Cancelled),
            _ = tx.send(StreamAgentEvent {
                event_type: "complete".to_string(),
                content: full_content,
                raw_chunk: None,
                error: None,
            }) => {}
        }

        return Ok(());
    }

    let err_msg = format!(
        "Agent循环次数超过限制({}次)，可能陷入无限循环",
        max_iterations
    );
    let _ = tx
        .send(StreamAgentEvent {
            event_type: "error".to_string(),
            content: format!("[error:{}]", err_msg),
            raw_chunk: None,
            error: Some(err_msg.clone()),
        })
        .await;
    Err(AgentError::MaxIterationsExceeded(max_iterations))
}

fn ensure_not_cancelled(cancellation: &CancellationToken) -> Result<(), AgentError> {
    if cancellation.is_cancelled() {
        Err(AgentError::Cancelled)
    } else {
        Ok(())
    }
}

fn delta_thinking_content(
    delta: &otherone_ai::types::ResponseDelta,
) -> Option<std::borrow::Cow<'_, str>> {
    delta.visible_reasoning()
}

fn message_thinking_content(
    message: &otherone_ai::types::ResponseMessage,
) -> Option<std::borrow::Cow<'_, str>> {
    message.visible_reasoning()
}

fn merge_tool_call_delta(
    tool_calls: &mut Vec<otherone_ai::types::ToolCall>,
    delta: &otherone_ai::types::ToolCall,
) {
    let target = match delta.index {
        Some(index) => {
            let target_index = index as usize;
            while tool_calls.len() <= target_index {
                tool_calls.push(empty_tool_call(Some(tool_calls.len() as u32)));
            }
            &mut tool_calls[target_index]
        }
        None => match tool_calls
            .iter()
            .position(|existing| !delta.id.is_empty() && existing.id == delta.id)
        {
            Some(position) => &mut tool_calls[position],
            None => {
                tool_calls.push(empty_tool_call(None));
                tool_calls.last_mut().expect("new tool call exists")
            }
        },
    };

    if delta.index.is_some() {
        target.index = delta.index;
    }
    if !delta.id.is_empty() {
        target.id = delta.id.clone();
    }
    if !delta.call_type.is_empty() {
        target.call_type = delta.call_type.clone();
    }
    if !delta.function.name.is_empty() {
        target.function.name.push_str(&delta.function.name);
    }
    if !delta.function.arguments.is_empty() {
        target
            .function
            .arguments
            .push_str(&delta.function.arguments);
    }
}

fn empty_tool_call(index: Option<u32>) -> otherone_ai::types::ToolCall {
    otherone_ai::types::ToolCall {
        index,
        id: String::new(),
        call_type: "function".to_string(),
        function: otherone_ai::types::FunctionCall::default(),
    }
}

fn stream_chunk_has_terminal_boundary(chunk: &otherone_ai::types::ChatResponse) -> bool {
    chunk.usage.is_some()
        || chunk
            .choices
            .iter()
            .any(|choice| choice.finish_reason.is_some())
}

/// 调用 Agent — 核心驱动方法
/// 作用：驱动完整的 AI 对话流程，支持非流式模式
/// 关联：调用所有子模块
/// 预期结果：返回最终的 ParsedResponse
pub async fn invoke_agent(
    input: &InputOptions,
    ai: &mut AiOptions,
    auxiliary_ai: Option<&mut AiOptions>,
) -> Result<otherone_ai::types::ParsedResponse, AgentError> {
    let mut required_terminal_tool = RequiredTerminalToolGuard::from_ai(ai)?;
    let long_term_memory_enabled = input.enable_long_term_memory.unwrap_or(false);
    let memory_queue = if long_term_memory_enabled {
        Some(Arc::new(Mutex::new(Vec::new())))
    } else {
        None
    };
    let memory_model_config = if long_term_memory_enabled {
        let model_source = auxiliary_ai.as_ref().map(|aux| &**aux).unwrap_or(ai);
        Some(MemoryModelConfig::from_ai(model_source))
    } else {
        None
    };
    let long_term_memory_recall_max_types =
        normalize_recall_max_types(input.long_term_memory_recall_max_types);

    if let Some(queue) = &memory_queue {
        configure_long_term_memory(ai, Arc::clone(queue), long_term_memory_recall_max_types);
    }

    let storage_type: StorageType = match &input.storage_type {
        Some(AgentStorageType::LocalFile) => StorageType::LocalFile,
        Some(AgentStorageType::Database) => StorageType::Database,
        None => StorageType::LocalFile,
    };

    // 如果有 user_prompt，先存储用户消息
    if let Some(message) = initial_user_message(ai) {
        write_user_message_entry(input, &storage_type, &message).await?;
    }

    // 循环次数限制
    let max_iterations = input.max_iterations.unwrap_or(999999);
    let mut iteration: u32 = 0;
    let mut long_term_memory_activity = false;
    let mut memory_fallback_prompt = initial_user_display_content(ai).map(ToString::to_string);

    while iteration < max_iterations {
        iteration += 1;

        // 组合 tools 配置
        let tools = otherone_tools::combine_tools(ai.tools.clone());
        ai.tools = tools;

        // 组合 context 配置，加载历史消息
        let context_load_type = match &input.context_load_type {
            AgentContextLoadType::LocalFile => otherone_context::types::ContextLoadType::LocalFile,
            AgentContextLoadType::Database => otherone_context::types::ContextLoadType::Database,
        };

        let messages =
            otherone_context::combine_context(&otherone_context::types::CombineContextOptions {
                session_id: input.session_id.clone(),
                load_type: context_load_type,
                provider: ai.provider.clone(),
                context_window: input.context_window,
                threshold_percentage: input.threshold_percentage,
                ai: ai.other.clone(),
                system_prompt: ai.system_prompt.clone(),
                tools: ai.tools.clone(),
                database_config: input.database_config.clone(),
                runtime_context: input.runtime_context.clone(),
            compact_executor: ai.compact_executor.clone(),
            })
            .await
            .map_err(|e| AgentError::ContextError(e.to_string()))?;
        if let Some(prompt) = latest_user_display_content(&messages) {
            memory_fallback_prompt = Some(prompt);
        }

        // 构建 AI 配置 JSON
        let messages = resolve_messages_for_model(ai, messages).await?;
        let ai_config = build_ai_config(ai, &messages);

        // 调用 AI 模型
        let response = if let Some(executor) = &ai.model_executor {
            executor.complete(ai_config).await?
        } else {
            otherone_ai::invoke_model(ai.provider.clone(), &ai.api_key, &ai.base_url, ai_config).await?
        };

        // 解析响应
        let mut parsed =
            parse_ai_response(&response, &ai.provider).map_err(|e| AgentError::ContextError(e))?;

        // 存储 AI 响应到 storage
        otherone_storage::write_entry(&WriteEntryOptions {
            storage_type: storage_type.clone(),
            session_id: input.session_id.clone(),
            role: parsed.role.clone(),
            content: parsed.content.clone(),
            tools: parsed
                .tools
                .as_ref()
                .map(|tw| serde_json::json!({ "tool_calls": tw.tool_calls })),
            token_consumption: Some(parsed.token_consumption),
            create_at: None,
            database_config: input.database_config.clone(),
            runtime_context: input.runtime_context.clone(),
            metadata: response.choices.first().and_then(|choice| choice.message.as_ref()).and_then(|message| message.reasoning_content.as_ref()).map(|reasoning| [("otherone_reasoning_content".into(), serde_json::json!(reasoning))].into_iter().collect()).unwrap_or_default(),
        })
        .await
        .map_err(|e| AgentError::ContextError(e.to_string()))?;

        // 检查是否有 tool 调用
        if let Some(ref tools_wrapper) = parsed.tools {
            if !tools_wrapper.tool_calls.is_empty() {
                required_terminal_tool.validate_tool_calls(&tools_wrapper.tool_calls)?;
                if tools_wrapper
                    .tool_calls
                    .iter()
                    .any(|tool_call| tool_call.function.name == LONG_TERM_MEMORY_TOOL_NAME)
                {
                    long_term_memory_activity = true;
                }

                let tool_calls_info: Vec<String> = tools_wrapper
                    .tool_calls
                    .iter()
                    .map(|tc| format!("{}({})", tc.function.name, tc.function.arguments))
                    .collect();
                parsed.content = format!(
                    "[tool_calls:{}]\n\n{}",
                    tool_calls_info.join(", "),
                    parsed.content
                );

                // 使用用户传入的 tools_realize，若未提供则使用空 HashMap
                let default_tools_realize = otherone_tools::ToolRealizationMap::new();
                let tools_realize = ai.tools_realize.as_ref().unwrap_or(&default_tools_realize);

                let tool_results = match rejected_user_input_batch(ai, &tools_wrapper.tool_calls) {
                    Some(results) => results,
                    None => execute_registered_tools(ai, input, &tools_wrapper.tool_calls, tools_realize, &CancellationToken::new()).await?,
                };
                required_terminal_tool.record_tool_results(&tool_results, ai)?;

                for tool_result in &tool_results {
                    let tool_content = serde_json::to_string(
                        tool_result
                            .result
                            .as_ref()
                            .unwrap_or(&serde_json::Value::Null),
                    )
                    .unwrap_or_default();

                    let tools_value = serde_json::json!({
                        "tool_call_id": tool_result.tool_call_id,
                        "function_name": tool_result.function_name,
                        "result": tool_result.result,
                        "error": tool_result.error,
                    });

                    otherone_storage::write_entry(&WriteEntryOptions {
                        storage_type: storage_type.clone(),
                        session_id: input.session_id.clone(),
                        role: "tool".to_string(),
                        content: tool_content,
                        tools: Some(tools_value),
                        token_consumption: None,
                        create_at: None,
                        database_config: input.database_config.clone(),
                        runtime_context: input.runtime_context.clone(),
                        metadata: Default::default(),
                    })
                    .await
                    .map_err(|e| AgentError::ContextError(e.to_string()))?;
                }

                spawn_drained_long_term_memory_processing(
                    &memory_queue,
                    &memory_model_config,
                    CancellationToken::new(),
                );

                if requested_user_input(ai, &tool_results) {
                    return Ok(parsed);
                }

                continue;
            }
        }

        if required_terminal_tool.prepare_completion(ai)? {
            continue;
        }

        spawn_long_term_memory_heuristic_fallback(
            &memory_model_config,
            memory_fallback_prompt.as_deref(),
            long_term_memory_activity,
            CancellationToken::new(),
        );

        return Ok(parsed);
    }

    Err(AgentError::MaxIterationsExceeded(max_iterations))
}

/// 构建 AI 调用的配置 JSON
pub fn build_ai_config(ai: &AiOptions, messages: &[otherone_ai::types::Message]) -> serde_json::Value {
    let mut config = serde_json::json!({
        "model": ai.model,
        "messages": messages,
    });

    if let Some(context_length) = ai.context_length {
        config["contextLength"] = serde_json::json!(context_length);
    }
    if let Some(temperature) = ai.temperature {
        config["temperature"] = serde_json::json!(temperature);
    }
    if let Some(top_p) = ai.top_p {
        config["topP"] = serde_json::json!(top_p);
    }
    if let Some(ref tools) = ai.tools {
        config["tools"] = serde_json::to_value(tools).unwrap();
    }
    if let Some(ref tool_choice) = ai.tool_choice {
        config["toolChoice"] = serde_json::to_value(tool_choice).unwrap();
    }
    if let Some(parallel_tool_calls) = ai.parallel_tool_calls {
        config["parallelToolCalls"] = serde_json::json!(parallel_tool_calls);
    }
    if let Some(stream) = ai.stream {
        config["stream"] = serde_json::json!(stream);
    }
    if let Some(ref other) = ai.other {
        if let serde_json::Value::Object(ref obj) = other {
            for (key, value) in obj {
                config[key] = value.clone();
            }
        }
    }

    config
}

impl MemoryModelConfig {
    fn from_ai(ai: &AiOptions) -> Self {
        Self {
            provider: ai.provider.clone(),
            api_key: ai.api_key.clone(),
            base_url: ai.base_url.clone(),
            model: ai.model.clone(),
            context_length: ai.context_length,
            temperature: ai.temperature,
            top_p: ai.top_p,
            other: ai.other.clone(),
        }
    }
}

fn configure_long_term_memory(
    ai: &mut AiOptions,
    queue: LongTermMemoryQueue,
    recall_max_types: usize,
) {
    inject_long_term_memory_system_prompt(ai);
    inject_long_term_memory_tools(ai, recall_max_types);
    inject_long_term_memory_tool_handlers(ai, queue, recall_max_types);
}

fn normalize_recall_max_types(max_types: Option<usize>) -> usize {
    max_types
        .unwrap_or(DEFAULT_LONG_TERM_MEMORY_RECALL_MAX_TYPES)
        .clamp(1, MAX_LONG_TERM_MEMORY_RECALL_MAX_TYPES)
}

fn inject_long_term_memory_system_prompt(ai: &mut AiOptions) {
    match ai.system_prompt.as_mut() {
        Some(system_prompt) => {
            if !system_prompt.contains(LONG_TERM_MEMORY_SYSTEM_PROMPT) {
                system_prompt.push_str("\n\n");
                system_prompt.push_str(LONG_TERM_MEMORY_SYSTEM_PROMPT);
            }
        }
        None => {
            ai.system_prompt = Some(LONG_TERM_MEMORY_SYSTEM_PROMPT.to_string());
        }
    }
}

fn inject_long_term_memory_tools(ai: &mut AiOptions, recall_max_types: usize) {
    let tools = ai.tools.get_or_insert_with(Vec::new);

    if !tools
        .iter()
        .any(|tool| tool.function.name == LONG_TERM_MEMORY_RECALL_TOOL_NAME)
    {
        tools.insert(0, long_term_memory_recall_tool_definition(recall_max_types));
    }

    if !tools
        .iter()
        .any(|tool| tool.function.name == LONG_TERM_MEMORY_TOOL_NAME)
    {
        tools.insert(0, long_term_memory_tool_definition());
    }
}

fn inject_long_term_memory_tool_handlers(
    ai: &mut AiOptions,
    queue: LongTermMemoryQueue,
    recall_max_types: usize,
) {
    let tools_realize = ai.tools_realize.get_or_insert_with(HashMap::new);
    tools_realize.insert(
        LONG_TERM_MEMORY_TOOL_NAME.to_string(),
        Box::new(move |args, _tool_call_id| enqueue_long_term_memory(args, Arc::clone(&queue))),
    );
    tools_realize.insert(
        LONG_TERM_MEMORY_RECALL_TOOL_NAME.to_string(),
        Box::new(move |args, _tool_call_id| recall_long_term_memory(args, recall_max_types)),
    );
}

fn long_term_memory_tool_definition() -> otherone_ai::types::Tool {
    otherone_ai::types::Tool {
        tool_type: "function".to_string(),
        function: otherone_ai::types::FunctionDefinition {
            name: LONG_TERM_MEMORY_TOOL_NAME.to_string(),
            description: "Queue reusable user information for long-term memory processing."
                .to_string(),
            parameters: Some(serde_json::json!({
                "type": "object",
                "properties": {
                    "storage": {
                        "type": "string",
                        "description": "Concise reusable memory statement."
                    },
                    "types": {
                        "type": "string",
                        "description": "Specific semantic category for the memory node."
                    },
                    "possible_parent_types": {
                        "type": "array",
                        "description": "Short keywords or semantic tags that may match existing parent memory categories.",
                        "items": {
                            "type": "string"
                        },
                        "minItems": 1,
                        "maxItems": 5
                    }
                },
                "required": ["storage", "types", "possible_parent_types"],
                "additionalProperties": false
            })),
        },
    }
}

fn long_term_memory_recall_tool_definition(recall_max_types: usize) -> otherone_ai::types::Tool {
    otherone_ai::types::Tool {
        tool_type: "function".to_string(),
        function: otherone_ai::types::FunctionDefinition {
            name: LONG_TERM_MEMORY_RECALL_TOOL_NAME.to_string(),
            description: "Recall relevant long-term memory facts by semantic type keywords."
                .to_string(),
            parameters: Some(serde_json::json!({
                "type": "object",
                "properties": {
                    "memory_types": {
                        "type": "array",
                        "description": "Compact semantic type keywords or tags for memories to retrieve.",
                        "items": {
                            "type": "string"
                        },
                        "minItems": 1,
                        "maxItems": recall_max_types
                    }
                },
                "required": ["memory_types"],
                "additionalProperties": false
            })),
        },
    }
}

fn enqueue_long_term_memory(args: serde_json::Value, queue: LongTermMemoryQueue) -> String {
    match parse_pending_long_term_memory(args) {
        Ok(pending_memory) => match queue.lock() {
            Ok(mut pending_queue) => pending_queue.push(pending_memory),
            Err(error) => warn!("failed to lock long-term memory queue: {error}"),
        },
        Err(error) => warn!("failed to parse long-term memory tool arguments: {error}"),
    }

    "done".to_string()
}

fn parse_pending_long_term_memory(
    args: serde_json::Value,
) -> Result<PendingLongTermMemory, String> {
    let mut pending: PendingLongTermMemory =
        serde_json::from_value(args).map_err(|error| error.to_string())?;

    pending.storage = pending.storage.trim().to_string();
    pending.types = pending.types.trim().to_string();
    let mut seen_parent_types = HashSet::new();
    pending.possible_parent_types = pending
        .possible_parent_types
        .into_iter()
        .map(|parent_type| parent_type.trim().to_string())
        .filter(|parent_type| !parent_type.is_empty())
        .filter(|parent_type| seen_parent_types.insert(parent_type.clone()))
        .take(5)
        .collect();

    if pending.storage.is_empty() {
        return Err("storage cannot be empty".to_string());
    }
    if pending.types.is_empty() {
        return Err("types cannot be empty".to_string());
    }
    if pending.possible_parent_types.is_empty() {
        pending.possible_parent_types.push(pending.types.clone());
    }

    Ok(pending)
}

fn recall_long_term_memory(args: serde_json::Value, recall_max_types: usize) -> String {
    match recall_long_term_memory_inner(args, recall_max_types) {
        Ok(recalled_memory) => recalled_memory,
        Err(error) => {
            warn!("failed to recall long-term memory: {error}");
            format!("Long-term memory recall failed: {error}")
        }
    }
}

fn recall_long_term_memory_inner(
    args: serde_json::Value,
    recall_max_types: usize,
) -> Result<String, String> {
    let memory_types = parse_recall_memory_types(args, recall_max_types)?;
    let tree = otherone_memory::read_memory_tree().map_err(|error| error.to_string())?;
    let branches = tree
        .recall_subtree_memories(
            &memory_types,
            &otherone_memory::MemoryRecallOptions {
                max_types: recall_max_types,
                max_matches_per_type: 3,
                max_returned_memories: 64,
            },
        )
        .map_err(|error| error.to_string())?;

    Ok(format_recalled_memories_for_agent(&branches))
}

fn parse_recall_memory_types(
    args: serde_json::Value,
    recall_max_types: usize,
) -> Result<Vec<String>, String> {
    let recall_args: LongTermMemoryRecallArgs =
        serde_json::from_value(args).map_err(|error| error.to_string())?;
    let mut seen = HashSet::new();
    let memory_types: Vec<String> = recall_args
        .memory_types
        .into_iter()
        .map(|memory_type| memory_type.trim().to_string())
        .filter(|memory_type| !memory_type.is_empty())
        .filter(|memory_type| seen.insert(memory_type.clone()))
        .take(recall_max_types)
        .collect();

    if memory_types.is_empty() {
        return Err("memory_types cannot be empty".to_string());
    }

    Ok(memory_types)
}

fn format_recalled_memories_for_agent(branches: &[otherone_memory::MemoryRecallBranch]) -> String {
    let mut seen = HashSet::new();
    let memories: Vec<String> = branches
        .iter()
        .flat_map(|branch| branch.memories.iter())
        .map(|memory| memory.trim())
        .filter(|memory| !memory.is_empty())
        .filter(|memory| seen.insert((*memory).to_string()))
        .map(|memory| memory.to_string())
        .collect();

    if memories.is_empty() {
        return "<long-term-memory>\nNo relevant long-term memory found.\n</long-term-memory>"
            .to_string();
    }

    let mut lines = vec!["<long-term-memory>".to_string()];
    for memory in memories {
        lines.push(format!("- {memory}"));
    }
    lines.push("</long-term-memory>".to_string());
    lines.join("\n")
}

fn spawn_drained_long_term_memory_processing(
    queue: &Option<LongTermMemoryQueue>,
    model_config: &Option<MemoryModelConfig>,
    cancellation: CancellationToken,
) {
    let pending_items = drain_long_term_memory_queue(queue);
    if pending_items.is_empty() {
        return;
    }

    let Some(model_config) = model_config.clone() else {
        return;
    };

    tokio::spawn(async move {
        let _guard = tokio::select! {
            biased;
            _ = cancellation.cancelled() => return,
            guard = long_term_memory_processing_lock().lock() => guard,
        };

        for pending_memory in pending_items {
            let result = tokio::select! {
                biased;
                _ = cancellation.cancelled() => return,
                result = process_long_term_memory_candidate(&model_config, pending_memory) => result,
            };
            if let Err(error) = result {
                warn!("failed to process long-term memory candidate: {error}");
            }
        }
    });
}

fn spawn_long_term_memory_heuristic_fallback(
    model_config: &Option<MemoryModelConfig>,
    user_prompt: Option<&str>,
    already_queued_memory: bool,
    cancellation: CancellationToken,
) {
    if already_queued_memory {
        return;
    }

    let Some(user_prompt) = user_prompt else {
        return;
    };
    if !should_queue_long_term_memory_fallback(user_prompt) {
        return;
    }

    let Some(model_config) = model_config.clone() else {
        return;
    };
    let pending_memory = PendingLongTermMemory {
        storage: user_prompt.trim().to_string(),
        types: LONG_TERM_MEMORY_FALLBACK_TYPES.to_string(),
        possible_parent_types: fallback_possible_parent_types(user_prompt),
    };

    tokio::spawn(async move {
        let _guard = tokio::select! {
            biased;
            _ = cancellation.cancelled() => return,
            guard = long_term_memory_processing_lock().lock() => guard,
        };
        let result = tokio::select! {
            biased;
            _ = cancellation.cancelled() => return,
            result = process_long_term_memory_candidate(&model_config, pending_memory) => result,
        };
        if let Err(error) = result {
            warn!("failed to process long-term memory fallback candidate: {error}");
        }
    });
}

fn should_queue_long_term_memory_fallback(user_prompt: &str) -> bool {
    let normalized = normalize_memory_fallback_text(user_prompt);
    if normalized.is_empty() {
        return false;
    }

    let negative_terms = [
        "临时",
        "这次",
        "当前",
        "今天",
        "刚刚",
        "一次性",
        "十分钟",
        "提醒我",
        "明天提醒",
        "验证码",
        "密码",
        "apikey",
        "api密钥",
        "不要长期",
        "不要记",
        "不用新增",
        "不用重复",
        "已经记住",
        "翻译",
        "算一下",
        "cargotest",
        "ignored",
    ];
    if negative_terms.iter().any(|term| normalized.contains(term)) {
        return false;
    }

    let positive_terms = [
        "可以长期",
        "长期",
        "以后",
        "默认",
        "偏好",
        "喜欢",
        "不喜欢",
        "过敏",
        "习惯",
        "项目里",
        "规则",
        "约定",
        "叫我",
        "我叫",
        "称呼",
        "不吃",
        "必须",
        "采用",
    ];
    positive_terms.iter().any(|term| normalized.contains(term))
}

fn fallback_possible_parent_types(user_prompt: &str) -> Vec<String> {
    let normalized = normalize_memory_fallback_text(user_prompt);

    if contains_any(&normalized, &["我叫", "叫我", "称呼"]) {
        return string_vec(&["身份信息", "称呼", "用户资料"]);
    }
    if contains_any(&normalized, &["中文", "英文", "语言", "交流", "沟通"]) {
        return string_vec(&["沟通偏好", "语言偏好", "对话设置"]);
    }
    if contains_any(
        &normalized,
        &["吃", "食物", "饮食", "菜", "辣", "香菜", "过敏"],
    ) {
        return string_vec(&["食物偏好", "饮食偏好", "忌口偏好"]);
    }
    if contains_any(
        &normalized,
        &[
            "rust",
            "代码",
            "项目",
            "规则",
            "架构",
            "memory",
            "向量数据库",
        ],
    ) {
        return string_vec(&["项目规则", "编码偏好", "技术规范"]);
    }
    if contains_any(
        &normalized,
        &["前端", "设计", "界面", "主题", "ui", "紫色", "渐变"],
    ) {
        return string_vec(&["设计偏好", "前端设计", "UI 主题"]);
    }
    if contains_any(&normalized, &["会议", "开会", "提纲", "资料"]) {
        return string_vec(&["工作习惯", "会议习惯", "沟通偏好"]);
    }
    if contains_any(&normalized, &["旅行", "景点", "路线"]) {
        return string_vec(&["旅行偏好", "生活方式偏好", "休闲偏好"]);
    }
    if contains_any(&normalized, &["跑步", "训练", "运动"]) {
        return string_vec(&["运动习惯", "健康偏好", "生活习惯"]);
    }

    string_vec(&["用户偏好", "长期约束", "用户资料"])
}

fn contains_any(value: &str, needles: &[&str]) -> bool {
    needles.iter().any(|needle| value.contains(needle))
}

fn string_vec(values: &[&str]) -> Vec<String> {
    values.iter().map(|value| value.to_string()).collect()
}

fn normalize_memory_fallback_text(value: &str) -> String {
    value
        .chars()
        .filter(|ch| !ch.is_whitespace())
        .flat_map(char::to_lowercase)
        .collect()
}

fn drain_long_term_memory_queue(queue: &Option<LongTermMemoryQueue>) -> Vec<PendingLongTermMemory> {
    let Some(queue) = queue else {
        return Vec::new();
    };

    match queue.lock() {
        Ok(mut pending_queue) => pending_queue.drain(..).collect(),
        Err(error) => {
            warn!("failed to drain long-term memory queue: {error}");
            Vec::new()
        }
    }
}

fn long_term_memory_processing_lock() -> &'static tokio::sync::Mutex<()> {
    static LOCK: OnceLock<tokio::sync::Mutex<()>> = OnceLock::new();
    LOCK.get_or_init(|| tokio::sync::Mutex::new(()))
}

async fn process_long_term_memory_candidate(
    model_config: &MemoryModelConfig,
    pending_memory: PendingLongTermMemory,
) -> Result<(), String> {
    let mut tree = otherone_memory::read_memory_tree().map_err(|error| error.to_string())?;
    let search_options = otherone_memory::MemoryTypeSearchOptions::default();
    let neighborhoods = tree
        .find_type_neighborhoods(&pending_memory.possible_parent_types, &search_options)
        .map_err(|error| error.to_string())?;
    let existing_memory_table =
        otherone_memory::MemoryTree::format_type_neighborhoods_for_model(&neighborhoods);

    let ai_config = build_long_term_memory_model_config(
        model_config,
        build_long_term_memory_messages(&pending_memory, &existing_memory_table),
    );
    let response = otherone_ai::invoke_model(
        model_config.provider.clone(),
        &model_config.api_key,
        &model_config.base_url,
        ai_config,
    )
    .await
    .map_err(|error| error.to_string())?;

    let commit_args = extract_long_term_memory_commit_args(&response)?;
    apply_long_term_memory_commit(&mut tree, &commit_args)?;
    tree.validate().map_err(|error| error.to_string())?;
    otherone_memory::write_memory_tree(&tree).map_err(|error| error.to_string())
}

fn build_long_term_memory_messages(
    pending_memory: &PendingLongTermMemory,
    existing_memory_table: &str,
) -> Vec<otherone_ai::types::Message> {
    vec![
        otherone_ai::types::Message { reasoning_content: None,
            role: "system".to_string(),
            content: otherone_ai::types::MessageContent::Text(
                LONG_TERM_MEMORY_MODEL_SYSTEM_PROMPT.to_string(),
            ),
            name: None,
            tool_calls: None,
            tool_call_id: None,
        },
        otherone_ai::types::Message { reasoning_content: None,
            role: "user".to_string(),
            content: otherone_ai::types::MessageContent::Text(format!(
                "<candidate-memory>\n{}\n</candidate-memory>\n\n{}",
                serde_json::to_string_pretty(pending_memory).unwrap_or_default(),
                existing_memory_table
            )),
            name: None,
            tool_calls: None,
            tool_call_id: None,
        },
    ]
}

fn build_long_term_memory_model_config(
    model_config: &MemoryModelConfig,
    messages: Vec<otherone_ai::types::Message>,
) -> serde_json::Value {
    let mut config = serde_json::json!({});

    if let Some(ref other) = model_config.other {
        if let serde_json::Value::Object(ref obj) = other {
            for (key, value) in obj {
                config[key] = value.clone();
            }
        }
    }

    config["model"] = serde_json::json!(model_config.model);
    config["messages"] = serde_json::json!(messages);
    config["tools"] = serde_json::json!([long_term_memory_commit_tool_definition()]);
    config["parallelToolCalls"] = serde_json::json!(false);
    config["stream"] = serde_json::json!(false);

    if let Some(context_length) = model_config.context_length {
        config["contextLength"] = serde_json::json!(context_length);
    }
    if let Some(temperature) = model_config.temperature {
        config["temperature"] = serde_json::json!(temperature);
    }
    if let Some(top_p) = model_config.top_p {
        config["topP"] = serde_json::json!(top_p);
    }

    config
}

fn long_term_memory_commit_tool_definition() -> otherone_ai::types::Tool {
    otherone_ai::types::Tool {
        tool_type: "function".to_string(),
        function: otherone_ai::types::FunctionDefinition {
            name: LONG_TERM_MEMORY_COMMIT_TOOL_NAME.to_string(),
            description:
                "Commit one validated long-term memory write operation to the memory tree."
                    .to_string(),
            parameters: Some(serde_json::json!({
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": [
                            "insert_root",
                            "insert_child",
                            "update_parent_and_insert_child",
                            "update_existing",
                            "ignore"
                        ],
                        "description": "The write operation to perform."
                    },
                    "storage": {
                        "type": "string",
                        "description": "Memory statement for a new or updated node."
                    },
                    "types": {
                        "type": "string",
                        "description": "Specific semantic category for a new or updated node."
                    },
                    "parent_id": {
                        "type": "string",
                        "description": "Parent point id for insert_child or update_parent_and_insert_child."
                    },
                    "target_id": {
                        "type": "string",
                        "description": "Existing point id for update_existing."
                    },
                    "parent_storage": {
                        "type": "string",
                        "description": "Optional replacement storage for the parent before inserting."
                    },
                    "parent_types": {
                        "type": "string",
                        "description": "Optional broader replacement types for the parent before inserting."
                    }
                },
                "required": ["action"],
                "additionalProperties": false
            })),
        },
    }
}

fn extract_long_term_memory_commit_args(
    response: &otherone_ai::types::ChatResponse,
) -> Result<LongTermMemoryCommitArgs, String> {
    let tool_call = response
        .choices
        .iter()
        .filter_map(|choice| choice.message.as_ref())
        .filter_map(|message| message.tool_calls.as_ref())
        .flat_map(|tool_calls| tool_calls.iter())
        .find(|tool_call| tool_call.function.name == LONG_TERM_MEMORY_COMMIT_TOOL_NAME)
        .ok_or_else(|| {
            "long-term memory model did not call otherone_commit_long_term_memory".to_string()
        })?;

    serde_json::from_str(&tool_call.function.arguments)
        .map_err(|error| format!("invalid memory commit arguments: {error}"))
}

fn apply_long_term_memory_commit(
    tree: &mut otherone_memory::MemoryTree,
    args: &LongTermMemoryCommitArgs,
) -> Result<(), String> {
    match args.action.trim() {
        "insert_root" => {
            let storage = required_commit_field(args.storage.as_ref(), "storage")?;
            let types = required_commit_field(args.types.as_ref(), "types")?;
            tree.insert_root(storage, types)
                .map(|_| ())
                .map_err(|error| error.to_string())
        }
        "insert_child" => {
            let parent_id = required_commit_field(args.parent_id.as_ref(), "parent_id")?;
            let storage = required_commit_field(args.storage.as_ref(), "storage")?;
            let types = required_commit_field(args.types.as_ref(), "types")?;
            tree.insert_child(&parent_id, storage, types)
                .map(|_| ())
                .map_err(|error| error.to_string())
        }
        "update_parent_and_insert_child" => {
            let parent_id = required_commit_field(args.parent_id.as_ref(), "parent_id")?;
            let storage = required_commit_field(args.storage.as_ref(), "storage")?;
            let types = required_commit_field(args.types.as_ref(), "types")?;
            let old_parent = tree
                .get(&parent_id)
                .cloned()
                .ok_or_else(|| format!("parent point not found: {parent_id}"))?;
            let parent_had_children = !tree
                .child_ids(&parent_id)
                .map_err(|error| error.to_string())?
                .is_empty();
            let old_parent_storage = old_parent
                .storage
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToString::to_string);
            let old_parent_types = old_parent
                .types
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToString::to_string);
            let new_parent_storage = optional_commit_field(args.parent_storage.as_ref());
            let should_preserve_old_parent_as_child = !parent_had_children
                && old_parent_storage
                    .as_ref()
                    .map(|old_storage| {
                        old_storage != &storage
                            && new_parent_storage
                                .as_ref()
                                .map(|parent_storage| !parent_storage.contains(old_storage))
                                .unwrap_or(false)
                    })
                    .unwrap_or(false);

            if let Some(parent_storage) = new_parent_storage {
                tree.update_storage(&parent_id, parent_storage)
                    .map_err(|error| error.to_string())?;
            }
            if let Some(parent_types) = optional_commit_field(args.parent_types.as_ref()) {
                tree.update_types(&parent_id, parent_types)
                    .map_err(|error| error.to_string())?;
            }

            if should_preserve_old_parent_as_child {
                let old_storage = old_parent_storage.expect("checked old parent storage exists");
                let old_types =
                    old_parent_types.unwrap_or_else(|| LONG_TERM_MEMORY_FALLBACK_TYPES.to_string());
                tree.insert_child(&parent_id, old_storage, old_types)
                    .map_err(|error| error.to_string())?;
            }

            tree.insert_child(&parent_id, storage, types)
                .map(|_| ())
                .map_err(|error| error.to_string())
        }
        "update_existing" => {
            let target_id = required_commit_field(args.target_id.as_ref(), "target_id")?;
            let mut updated = false;

            if let Some(storage) = optional_commit_field(args.storage.as_ref()) {
                tree.update_storage(&target_id, storage)
                    .map_err(|error| error.to_string())?;
                updated = true;
            }
            if let Some(types) = optional_commit_field(args.types.as_ref()) {
                tree.update_types(&target_id, types)
                    .map_err(|error| error.to_string())?;
                updated = true;
            }

            if updated {
                Ok(())
            } else {
                Err("update_existing requires storage or types".to_string())
            }
        }
        "ignore" => Ok(()),
        action => Err(format!("unsupported memory commit action: {action}")),
    }
}

fn required_commit_field(value: Option<&String>, field: &str) -> Result<String, String> {
    optional_commit_field(value).ok_or_else(|| format!("{field} is required"))
}

fn optional_commit_field(value: Option<&String>) -> Option<String> {
    value
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initial_model_retry_is_limited_to_transient_failures() {
        for status in [408, 425, 429, 500, 502, 503, 599] {
            assert!(retryable_initial_model_error(&AiError::ApiError {
                status,
                message: "transient".to_string(),
            }));
        }
        for status in [400, 401, 403, 404, 422] {
            assert!(!retryable_initial_model_error(&AiError::ApiError {
                status,
                message: "permanent".to_string(),
            }));
        }
        assert!(!retryable_initial_model_error(&AiError::ConfigError(
            "invalid".to_string()
        )));
        assert!(!retryable_initial_model_error(&AiError::StreamError(
            "partial stream".to_string()
        )));
    }

    #[test]
    fn initial_model_retry_backoff_is_short_and_bounded() {
        assert_eq!(INITIAL_MODEL_REQUEST_MAX_ATTEMPTS, 4);
        assert_eq!(initial_model_retry_delay(1), Duration::from_millis(250));
        assert_eq!(initial_model_retry_delay(2), Duration::from_millis(500));
        assert_eq!(initial_model_retry_delay(3), Duration::from_millis(1_000));
        assert_eq!(initial_model_retry_delay(99), Duration::from_millis(2_000));
    }

    #[test]
    fn openrouter_reasoning_details_enter_the_framework_thinking_path() {
        let delta: otherone_ai::types::ResponseDelta = serde_json::from_value(serde_json::json!({
            "reasoning_details": [{
                "type": "reasoning.text",
                "text": "Visible Sub Agent work"
            }]
        }))
        .unwrap();
        let message: otherone_ai::types::ResponseMessage =
            serde_json::from_value(serde_json::json!({
                "reasoning_details": [{
                    "type": "reasoning.summary",
                    "summary": "Visible non-stream work"
                }]
            }))
            .unwrap();

        assert_eq!(
            delta_thinking_content(&delta).as_deref(),
            Some("Visible Sub Agent work")
        );
        assert_eq!(
            message_thinking_content(&message).as_deref(),
            Some("Visible non-stream work")
        );
    }

    #[test]
    fn stream_terminal_boundary_requires_finish_reason_or_usage() {
        let partial: otherone_ai::types::ChatResponse = serde_json::from_value(serde_json::json!({
            "id": "generation-partial",
            "choices": [{
                "index": 0,
                "delta": {"reasoning": "still working"},
                "finish_reason": null
            }]
        }))
        .unwrap();
        let finished: otherone_ai::types::ChatResponse =
            serde_json::from_value(serde_json::json!({
                "id": "generation-finished",
                "choices": [{
                    "index": 0,
                    "delta": {},
                    "finish_reason": "tool_calls"
                }]
            }))
            .unwrap();
        let usage_only: otherone_ai::types::ChatResponse =
            serde_json::from_value(serde_json::json!({
                "id": "generation-usage",
                "choices": [],
                "usage": {"total_tokens": 42}
            }))
            .unwrap();

        assert!(!stream_chunk_has_terminal_boundary(&partial));
        assert!(stream_chunk_has_terminal_boundary(&finished));
        assert!(stream_chunk_has_terminal_boundary(&usage_only));
    }

    use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    fn test_ai_options() -> AiOptions {
        AiOptions {
            provider: otherone_ai::types::ProviderType::OpenAI,
            api_key: "test-key".to_string(),
            base_url: "https://api.openai.com/v1".to_string(),
            model: "gpt-4".to_string(),
            user_prompt: None,
            user_message: None,
            system_prompt: None,
            messages: None,
            context_length: None,
            temperature: None,
            top_p: None,
            tools: None,
            tool_registry: None,
            terminal_tools: Vec::new(),
            tools_realize: None,
            tool_choice: None,
            required_terminal_tool: None,
            user_input_tool: None,
            parallel_tool_calls: None,
            stream: None,
            other: None,
            message_resolver: None,
            raw_chunk_observer: None,
            model_executor: None,
            compact_executor: None,
        }
    }

    fn required_terminal_tool_ai() -> AiOptions {
        let mut ai = test_ai_options();
        ai.tools = Some(vec![otherone_ai::types::Tool {
            tool_type: "function".to_string(),
            function: otherone_ai::types::FunctionDefinition {
                name: "CommitArtifact".to_string(),
                description: "Commit the durable artifact.".to_string(),
                parameters: Some(serde_json::json!({
                    "type": "object",
                    "properties": {}
                })),
            },
        }]);
        let mut realizations = otherone_tools::ToolRealizationMap::new();
        realizations.insert(
            "CommitArtifact".to_string(),
            Box::new(|_, _| r#"{"status":"succeeded"}"#.to_string()),
        );
        ai.tools_realize = Some(realizations);
        ai.tool_choice = Some(otherone_ai::types::ToolChoice::String("auto".to_string()));
        ai.required_terminal_tool = Some("CommitArtifact".to_string());
        ai
    }

    fn test_tool_call(name: &str, id: &str) -> otherone_ai::types::ToolCall {
        otherone_ai::types::ToolCall {
            index: Some(0),
            id: id.to_string(),
            call_type: "function".to_string(),
            function: otherone_ai::types::FunctionCall {
                name: name.to_string(),
                arguments: "{}".to_string(),
            },
        }
    }

    #[test]
    fn required_terminal_tool_forces_once_then_disables_tools() {
        let mut ai = required_terminal_tool_ai();
        let mut guard = RequiredTerminalToolGuard::from_ai(&ai).expect("valid guard");

        assert!(guard
            .prepare_completion(&mut ai)
            .expect("prepare forced retry"));
        assert_eq!(
            serde_json::to_value(ai.tool_choice.as_ref().expect("forced choice")).unwrap(),
            serde_json::json!({
                "type": "function",
                "function": {"name": "CommitArtifact"}
            })
        );

        let call = test_tool_call("CommitArtifact", "call-1");
        guard
            .validate_tool_calls(std::slice::from_ref(&call))
            .expect("forced exact tool");
        guard
            .record_tool_results(
                &[otherone_tools::types::ToolResult {
                    tool_call_id: call.id,
                    function_name: "CommitArtifact".to_string(),
                    result: Some(serde_json::json!({"status": "succeeded"})),
                    error: None,
                    error_kind: None,
                }],
                &mut ai,
            )
            .expect("record terminal success");

        assert_eq!(
            serde_json::to_value(ai.tool_choice.as_ref().expect("disabled choice")).unwrap(),
            serde_json::json!("none")
        );
        assert!(!guard
            .prepare_completion(&mut ai)
            .expect("terminal tool completed"));
        assert!(guard
            .validate_tool_calls(&[test_tool_call("CommitArtifact", "call-2")])
            .is_err());
    }

    #[test]
    fn required_terminal_tool_rejects_ignored_force_and_parallel_terminal_batch() {
        let mut ai = required_terminal_tool_ai();
        let mut guard = RequiredTerminalToolGuard::from_ai(&ai).expect("valid guard");
        guard
            .prepare_completion(&mut ai)
            .expect("prepare forced retry");

        assert!(guard
            .validate_tool_calls(&[test_tool_call("ReadArtifact", "call-read")])
            .is_err());
        assert!(guard
            .validate_tool_calls(&[
                test_tool_call("CommitArtifact", "call-commit"),
                test_tool_call("ReadArtifact", "call-read"),
            ])
            .is_err());
    }

    #[test]
    fn required_terminal_tool_retries_after_embedded_tool_error() {
        let mut ai = required_terminal_tool_ai();
        let mut guard = RequiredTerminalToolGuard::from_ai(&ai).expect("valid guard");

        guard
            .record_tool_results(
                &[otherone_tools::types::ToolResult {
                    tool_call_id: "call-failed".to_string(),
                    function_name: "CommitArtifact".to_string(),
                    result: Some(serde_json::Value::String(
                        serde_json::json!({"error": "invalid target"}).to_string(),
                    )),
                    error: None,
                    error_kind: None,
                }],
                &mut ai,
            )
            .expect("embedded tool failure remains recoverable");

        assert_eq!(
            serde_json::to_value(ai.tool_choice.as_ref().expect("original choice")).unwrap(),
            serde_json::json!("auto")
        );
        assert!(guard
            .prepare_completion(&mut ai)
            .expect("failed terminal call requires a forced retry"));
    }

    #[test]
    fn required_terminal_tool_must_be_declared_and_realized() {
        let mut ai = test_ai_options();
        ai.required_terminal_tool = Some("CommitArtifact".to_string());
        let error = RequiredTerminalToolGuard::from_ai(&ai).expect_err("invalid guard");
        assert!(error.to_string().contains("tools and tools_realize"));
    }

    fn legacy_stream_test_lock() -> &'static tokio::sync::Mutex<()> {
        static LOCK: OnceLock<tokio::sync::Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| tokio::sync::Mutex::new(()))
    }

    fn legacy_stream_input(session_id: String) -> InputOptions {
        InputOptions {
            session_id,
            context_load_type: AgentContextLoadType::LocalFile,
            storage_type: Some(AgentStorageType::LocalFile),
            database_config: None,
            runtime_context: None,
            context_window: 8_192,
            threshold_percentage: Some(1.1),
            max_iterations: Some(4),
            enable_long_term_memory: Some(false),
            long_term_memory_recall_max_types: None,
        }
    }

    fn unique_legacy_storage_root(label: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!(
            "otherone-agent-{label}-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("clock before epoch")
                .as_nanos()
        ))
    }

    async fn read_test_http_request_bytes(stream: &mut tokio::net::TcpStream) -> Vec<u8> {
        let mut request = Vec::new();
        let header_end = loop {
            if let Some(index) = request.windows(4).position(|window| window == b"\r\n\r\n") {
                break index + 4;
            }
            let mut buffer = [0u8; 4_096];
            let read = stream.read(&mut buffer).await.expect("read test request");
            assert!(read > 0, "client closed before sending HTTP headers");
            request.extend_from_slice(&buffer[..read]);
        };
        let headers = String::from_utf8_lossy(&request[..header_end]);
        let content_length = headers
            .lines()
            .filter_map(|line| line.split_once(':'))
            .find(|(name, _)| name.eq_ignore_ascii_case("content-length"))
            .and_then(|(_, value)| value.trim().parse::<usize>().ok())
            .unwrap_or(0);
        let expected = header_end.saturating_add(content_length);
        while request.len() < expected {
            let mut buffer = [0u8; 4_096];
            let read = stream.read(&mut buffer).await.expect("read test body");
            assert!(read > 0, "client closed before sending HTTP body");
            request.extend_from_slice(&buffer[..read]);
        }
        request
    }

    async fn read_test_http_request(stream: &mut tokio::net::TcpStream) {
        let _ = read_test_http_request_bytes(stream).await;
    }

    async fn pending_sse_server() -> (
        String,
        tokio::sync::oneshot::Receiver<()>,
        tokio::task::JoinHandle<bool>,
    ) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind pending SSE server");
        let address = listener.local_addr().expect("read pending SSE address");
        let (ready_tx, ready_rx) = tokio::sync::oneshot::channel();
        let task = tokio::spawn(async move {
            let (mut stream, _) = listener.accept().await.expect("accept pending SSE request");
            read_test_http_request(&mut stream).await;
            stream
                .write_all(
                    b"HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nConnection: close\r\n\r\n",
                )
                .await
                .expect("write pending SSE headers");
            let _ = ready_tx.send(());
            let mut buffer = [0u8; 1];
            loop {
                match stream.read(&mut buffer).await {
                    Ok(0) => return true,
                    Ok(_) => continue,
                    Err(_) => return true,
                }
            }
        });
        (format!("http://{address}/v1"), ready_rx, task)
    }

    async fn tool_call_sse_server() -> String {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind tool SSE server");
        let address = listener.local_addr().expect("read tool SSE address");
        tokio::spawn(async move {
            let (mut stream, _) = listener.accept().await.expect("accept tool SSE request");
            read_test_http_request(&mut stream).await;
            let body = concat!(
                "data: {\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\",\"tool_calls\":[{\"index\":0,\"id\":\"call_sub\",\"type\":\"function\",\"function\":{\"name\":\"CallSubAgent\",\"arguments\":\"{}\"}}]},\"finish_reason\":\"tool_calls\"}]}\n",
                "data: [DONE]\n"
            );
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                body.len(),
                body
            );
            stream
                .write_all(response.as_bytes())
                .await
                .expect("write tool SSE response");
        });
        format!("http://{address}/v1")
    }

    #[test]
    fn user_input_yield_requires_a_declared_successful_receipt() {
        let mut ai = test_ai_options();
        let mut result = otherone_tools::types::ToolResult {
            tool_call_id: "call".into(), function_name: "AskQuestions".into(),
            result: Some(serde_json::json!({"status":"awaiting_user"})),
            error: None, error_kind: None,
        };
        assert!(!requested_user_input(&ai, &[result.clone()]));
        ai.user_input_tool = Some("AskQuestions".into());
        assert!(requested_user_input(&ai, &[result.clone()]));
        result.result = Some(serde_json::json!(r#"{"status":"awaiting_user","requestId":"call"}"#));
        assert!(requested_user_input(&ai, &[result.clone()]));
        result.result = Some(serde_json::json!({"status":"awaiting_user","error":"invalid"}));
        assert!(!requested_user_input(&ai, &[result.clone()]));
        result.result = Some(serde_json::json!({"status":"failed"}));
        assert!(!requested_user_input(&ai, &[result.clone()]));
        result.result = Some(serde_json::json!({"status":"awaiting_user"}));
        result.function_name = "web_fetch".into();
        assert!(!requested_user_input(&ai, &[result]));
        let calls: Vec<otherone_ai::types::ToolCall> = serde_json::from_value(serde_json::json!([
            {"id":"q","type":"function","function":{"name":"AskQuestions","arguments":"{}"}},
            {"id":"write","type":"function","function":{"name":"Save","arguments":"{}"}}
        ])).unwrap();
        let rejected = rejected_user_input_batch(&ai, &calls).unwrap();
        assert_eq!(rejected.len(), 2);
        assert!(rejected.iter().all(|result| result.result.as_ref().unwrap()["status"] == "failed"));
        assert!(!requested_user_input(&ai, &rejected));
        assert!(rejected_user_input_batch(&ai, &calls[..1]).is_none());
        assert!(rejected_user_input_batch(&ai, &[calls[0].clone(), calls[0].clone()]).is_some());
        ai.user_input_tool = None;
        assert!(rejected_user_input_batch(&ai, &calls).is_none());
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn user_input_tool_persists_receipt_and_completes_without_another_model_call() {
        let _guard = legacy_stream_test_lock().lock().await;
        otherone_storage::localfile::set_storage_root(unique_legacy_storage_root("user-input"));
        let session_id = otherone_storage::localfile::writer::create_new_session().unwrap();
        let mut ai = test_ai_options();
        ai.base_url = tool_call_sse_server().await;
        ai.user_prompt = Some("Ask for my design preference".into());
        ai.user_input_tool = Some("CallSubAgent".into());
        ai.tools = Some(vec![otherone_ai::types::Tool {
            tool_type: "function".into(), function: otherone_ai::types::FunctionDefinition {
                name: "CallSubAgent".into(), description: "Test interaction".into(),
                parameters: Some(serde_json::json!({"type":"object","properties":{}})),
            },
        }]);
        let mut handlers = otherone_tools::ToolRealizationMap::new();
        handlers.insert("CallSubAgent".into(), Box::new(|_, id| serde_json::json!({
            "status":"awaiting_user","requestId":id,"questions":[{"id":"density","question":"Density?"}]
        }).to_string()));
        ai.tools_realize = Some(handlers);
        let mut handle = invoke_agent_stream_interactive_with_cancellation(
            legacy_stream_input(session_id.clone()), ai, None, CancellationToken::new(),
        ).await.unwrap();
        let events = tokio::time::timeout(Duration::from_secs(5), async {
            let mut events = Vec::new();
            while let Some(event) = handle.recv().await {
                if event.event_type == "user_input_requested" {
                    let stored = otherone_storage::localfile::reader::read_session_data(&session_id).unwrap();
                    assert!(stored.entries.iter().any(|entry| entry.role == "tool" && entry.content.contains("awaiting_user")));
                    let payload = event.raw_chunk.as_ref().unwrap();
                    assert_eq!(payload["toolName"], "CallSubAgent");
                    assert_eq!(payload["toolCallId"], "call_sub");
                    assert!(payload["result"].is_object());
                    assert_eq!(payload["result"]["status"], "awaiting_user");
                }
                events.push(event);
            }
            events
        }).await.expect("question turn should finish");
        handle.wait().await.unwrap();
        assert_eq!(events.iter().filter(|e| e.event_type == "complete").count(), 1);
        assert_eq!(events.iter().filter(|e| e.event_type == "user_input_requested").count(), 1);
        assert!(events.iter().position(|e| e.event_type == "user_input_requested").unwrap()
            < events.iter().position(|e| e.event_type == "complete").unwrap());
        assert!(!events.iter().any(|e| e.event_type == "error" || e.event_type == "cancelled"));
        let stored = otherone_storage::localfile::reader::read_session_data(&session_id).unwrap();
        let receipts = stored.entries.iter().filter(|entry| entry.role == "tool").collect::<Vec<_>>();
        assert_eq!(receipts.len(), 1);
        assert!(receipts[0].content.contains("awaiting_user"));
        assert_eq!(stored.entries.iter().filter(|entry| entry.role == "assistant").count(), 1);
        otherone_storage::localfile::clear_storage_root();
    }

    async fn user_input_mixed_batch_server(streaming: bool) -> (String, tokio::task::JoinHandle<usize>) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let task = tokio::spawn(async move {
            for index in 0..2 {
                let (mut socket, _) = listener.accept().await.unwrap();
                let request = String::from_utf8(read_test_http_request_bytes(&mut socket).await).unwrap();
                if index == 1 {
                    assert!(request.contains("No tools in this batch were executed"));
                    assert!(request.contains("call_question_bad") && request.contains("call_mutation"));
                }
                let calls = if index == 0 {
                    serde_json::json!([
                        {"index":0,"id":"call_question_bad","type":"function","function":{"name":"AskQuestions","arguments":"{}"}},
                        {"index":1,"id":"call_mutation","type":"function","function":{"name":"Save","arguments":"{}"}}
                    ])
                } else {
                    serde_json::json!([
                        {"index":0,"id":"call_question_good","type":"function","function":{"name":"AskQuestions","arguments":"{}"}}
                    ])
                };
                let (content_type, body) = if streaming {
                    let chunk = serde_json::json!({"choices":[{"index":0,"delta":{"role":"assistant","tool_calls":calls},"finish_reason":"tool_calls"}]});
                    ("text/event-stream", format!("data: {chunk}\n\ndata: [DONE]\n\n"))
                } else {
                    ("application/json", serde_json::json!({
                        "id":format!("generation-{index}"),"object":"chat.completion","created":1,"model":"test-model",
                        "choices":[{"index":0,"message":{"role":"assistant","content":"","tool_calls":calls},"finish_reason":"tool_calls"}],
                        "usage":{"prompt_tokens":10,"completion_tokens":1,"total_tokens":11}
                    }).to_string())
                };
                let response = format!("HTTP/1.1 200 OK\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
                socket.write_all(response.as_bytes()).await.unwrap();
            }
            2
        });
        (format!("http://{address}/v1"), task)
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn user_input_mixed_batches_are_persisted_retried_and_never_execute_mutations() {
        let _guard = legacy_stream_test_lock().lock().await;
        for streaming in [true, false] {
            otherone_storage::localfile::set_storage_root(unique_legacy_storage_root("user-input-mixed"));
            let session_id = otherone_storage::localfile::writer::create_new_session().unwrap();
            let (base_url, server) = user_input_mixed_batch_server(streaming).await;
            let questions = Arc::new(AtomicUsize::new(0));
            let mutations = Arc::new(AtomicUsize::new(0));
            let mut ai = test_ai_options();
            ai.base_url = base_url;
            ai.stream = Some(streaming);
            ai.user_prompt = Some("Ask a question before authoring".into());
            ai.user_input_tool = Some("AskQuestions".into());
            ai.tools = Some(["AskQuestions", "Save"].into_iter().map(|name| otherone_ai::types::Tool {
                tool_type: "function".into(), function: otherone_ai::types::FunctionDefinition {
                    name: name.into(), description: "Test tool".into(), parameters: Some(serde_json::json!({"type":"object","properties":{}})),
                },
            }).collect());
            let mut handlers = otherone_tools::ToolRealizationMap::new();
            let question_count = questions.clone();
            handlers.insert("AskQuestions".into(), Box::new(move |_, call| {
                question_count.fetch_add(1, Ordering::SeqCst);
                assert_eq!(call, "call_question_good");
                serde_json::json!({"status":"awaiting_user","requestId":call,"questions":[{"id":"density","question":"Density?"}]}).to_string()
            }));
            let mutation_count = mutations.clone();
            handlers.insert("Save".into(), Box::new(move |_, _| {
                mutation_count.fetch_add(1, Ordering::SeqCst);
                "unexpected mutation".into()
            }));
            ai.tools_realize = Some(handlers);
            let input = legacy_stream_input(session_id.clone());
            if streaming {
                let mut handle = invoke_agent_stream_interactive_with_cancellation(input, ai, None, CancellationToken::new()).await.unwrap();
                let events = collect_legacy_events(&mut handle).await;
                handle.wait().await.unwrap();
                assert_eq!(events.iter().filter(|event| event.event_type == "user_input_requested").count(), 1);
                assert!(!events.iter().any(|event| event.event_type == "error"));
            } else {
                invoke_agent(&input, &mut ai, None).await.unwrap();
            }
            assert_eq!(server.await.unwrap(), 2);
            assert_eq!(questions.load(Ordering::SeqCst), 1);
            assert_eq!(mutations.load(Ordering::SeqCst), 0);
            let stored = otherone_storage::localfile::reader::read_session_data(&session_id).unwrap();
            let receipts = stored.entries.iter().filter(|entry| entry.role == "tool").collect::<Vec<_>>();
            assert_eq!(receipts.len(), 3);
            assert_eq!(receipts.iter().filter(|entry| entry.content.contains("No tools in this batch were executed")).count(), 2);
            assert_eq!(receipts.iter().filter(|entry| entry.content.contains("awaiting_user")).count(), 1);
            otherone_storage::localfile::clear_storage_root();
        }
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn user_input_cancelled_before_receipt_storage_emits_no_card() {
        let _guard = legacy_stream_test_lock().lock().await;
        otherone_storage::localfile::set_storage_root(unique_legacy_storage_root("user-input-cancel"));
        let session_id = otherone_storage::localfile::writer::create_new_session().unwrap();
        let mut ai = test_ai_options();
        ai.base_url = tool_call_sse_server().await;
        ai.user_prompt = Some("Ask for my preference".into());
        ai.user_input_tool = Some("CallSubAgent".into());
        let cancellation = CancellationToken::new();
        let handler_cancellation = cancellation.clone();
        let mut handlers = otherone_tools::ToolRealizationMap::new();
        handlers.insert("CallSubAgent".into(), Box::new(move |_, _| {
            handler_cancellation.cancel();
            serde_json::json!({"status":"awaiting_user","requestId":"cancelled"}).to_string()
        }));
        ai.tools_realize = Some(handlers);
        let mut handle = invoke_agent_stream_interactive_with_cancellation(
            legacy_stream_input(session_id.clone()), ai, None, cancellation,
        ).await.unwrap();
        let events = collect_legacy_events(&mut handle).await;
        handle.wait().await.unwrap();
        assert!(!events.iter().any(|event| event.event_type == "user_input_requested"));
        assert_single_cancelled_terminal(&events);
        let stored = otherone_storage::localfile::reader::read_session_data(&session_id).unwrap();
        assert!(!stored.entries.iter().any(|entry| entry.role == "tool"));
        otherone_storage::localfile::clear_storage_root();
    }

    async fn truncated_sse_server() -> (String, tokio::task::JoinHandle<usize>) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind truncated SSE server");
        let address = listener
            .local_addr()
            .expect("read truncated SSE server address");
        let task = tokio::spawn(async move {
            let (mut stream, _) = listener.accept().await.expect("accept truncated request");
            read_test_http_request(&mut stream).await;
            let body = concat!(
                "data: {\"id\":\"generation-truncated\",\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\",\"reasoning\":\"still working\"},\"finish_reason\":null}]}\n\n",
                "data: [DONE]\n\n"
            );
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                body.len(),
                body
            );
            stream
                .write_all(response.as_bytes())
                .await
                .expect("write truncated SSE response");
            1
        });
        (format!("http://{address}/v1"), task)
    }

    async fn empty_then_valid_json_server() -> (String, tokio::task::JoinHandle<usize>) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind JSON response server");
        let address = listener.local_addr().expect("read JSON server address");
        let task = tokio::spawn(async move {
            let contents = ["", "recovered structured response"];
            for (index, content) in contents.into_iter().enumerate() {
                let (mut stream, _) = listener.accept().await.expect("accept JSON request");
                let request = read_test_http_request_bytes(&mut stream).await;
                let request = String::from_utf8(request).expect("UTF-8 test request");
                assert!(request.contains(r#""stream":false"#), "{request}");

                let body = serde_json::json!({
                    "id": format!("generation-{index}"),
                    "object": "chat.completion",
                    "created": 1,
                    "model": "test-model",
                    "choices": [{
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": content
                        },
                        "finish_reason": "stop"
                    }],
                    "usage": {
                        "prompt_tokens": 10,
                        "completion_tokens": index as u32,
                        "total_tokens": 10 + index as u32
                    }
                })
                .to_string();
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                stream
                    .write_all(response.as_bytes())
                    .await
                    .expect("write JSON response");
            }
            contents.len()
        });
        (format!("http://{address}/v1"), task)
    }

    async fn empty_then_error_json_server() -> (String, tokio::task::JoinHandle<usize>) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind empty-then-error server");
        let address = listener
            .local_addr()
            .expect("read empty-then-error server address");
        let task = tokio::spawn(async move {
            let (mut first, _) = listener
                .accept()
                .await
                .expect("accept empty response request");
            read_test_http_request(&mut first).await;
            let body = serde_json::json!({
                "id": "generation-empty",
                "object": "chat.completion",
                "created": 1,
                "model": "test-model",
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": ""},
                    "finish_reason": "stop"
                }],
                "usage": {"prompt_tokens": 10, "completion_tokens": 0, "total_tokens": 10}
            })
            .to_string();
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                body.len(),
                body
            );
            first
                .write_all(response.as_bytes())
                .await
                .expect("write empty response");

            let (mut second, _) = listener
                .accept()
                .await
                .expect("accept failed retry request");
            read_test_http_request(&mut second).await;
            let body = r#"{"error":{"message":"permanent retry failure"}}"#;
            let response = format!(
                "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                body.len(),
                body
            );
            second
                .write_all(response.as_bytes())
                .await
                .expect("write failed retry response");
            2
        });
        (format!("http://{address}/v1"), task)
    }

    async fn collect_legacy_events(handle: &mut AgentStreamHandle) -> Vec<StreamAgentEvent> {
        tokio::time::timeout(Duration::from_secs(5), async {
            let mut events = Vec::new();
            while let Some(event) = handle.recv().await {
                events.push(event);
            }
            events
        })
        .await
        .expect("legacy stream did not close")
    }

    fn assert_single_cancelled_terminal(events: &[StreamAgentEvent]) {
        let terminals = events
            .iter()
            .filter(|event| {
                matches!(
                    event.event_type.as_str(),
                    "complete" | "error" | "cancelled"
                )
            })
            .map(|event| event.event_type.as_str())
            .collect::<Vec<_>>();
        assert_eq!(terminals, vec!["cancelled"]);
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn cancelling_pending_main_model_closes_connection_and_emits_one_terminal() {
        let _guard = legacy_stream_test_lock().lock().await;
        let root = unique_legacy_storage_root("pending-main-cancel");
        otherone_storage::localfile::set_storage_root(root);
        let session_id = otherone_storage::localfile::writer::create_new_session()
            .expect("create pending main session");
        let (base_url, request_ready, server) = pending_sse_server().await;
        let mut ai = test_ai_options();
        ai.base_url = base_url;
        ai.user_prompt = Some("wait".to_string());
        let cancellation = CancellationToken::new();
        let mut handle = invoke_agent_stream_interactive_with_cancellation(
            legacy_stream_input(session_id),
            ai,
            None,
            cancellation,
        )
        .await
        .expect("start pending main run");

        tokio::time::timeout(Duration::from_secs(5), request_ready)
            .await
            .expect("provider request did not start")
            .expect("provider readiness sender dropped");
        handle.cancel();
        let events = collect_legacy_events(&mut handle).await;
        handle.wait().await.expect("join pending main run");
        assert_single_cancelled_terminal(&events);
        assert!(tokio::time::timeout(Duration::from_secs(5), server)
            .await
            .expect("provider connection stayed open")
            .expect("pending SSE server panicked"));
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn truncated_stream_fails_without_persisting_or_forcing_terminal_tool_retry() {
        let _guard = legacy_stream_test_lock().lock().await;
        let root = unique_legacy_storage_root("truncated-stream");
        otherone_storage::localfile::set_storage_root(root);
        let session_id = otherone_storage::localfile::writer::create_new_session()
            .expect("create truncated stream session");
        let (base_url, server) = truncated_sse_server().await;
        let mut ai = required_terminal_tool_ai();
        ai.base_url = base_url;
        ai.user_prompt = Some("commit one artifact".to_string());
        let cancellation = CancellationToken::new();
        let mut handle = invoke_agent_stream_interactive_with_cancellation(
            legacy_stream_input(session_id.clone()),
            ai,
            None,
            cancellation,
        )
        .await
        .expect("start truncated stream run");

        let events = collect_legacy_events(&mut handle).await;
        handle.wait().await.expect("join truncated stream run");
        assert!(events.iter().any(|event| {
            event.event_type == "error"
                && event.error.as_deref().is_some_and(|error| {
                    error.contains("AI response stream ended before a terminal chunk")
                })
        }));
        assert!(!events
            .iter()
            .any(|event| event.event_type == "required_tool_retry"));
        assert!(!events.iter().any(|event| event.event_type == "complete"));
        assert_eq!(
            tokio::time::timeout(Duration::from_secs(5), server)
                .await
                .expect("truncated SSE server did not stop")
                .expect("truncated SSE server panicked"),
            1
        );

        let session = otherone_storage::localfile::reader::read_session_data(&session_id)
            .expect("read truncated stream session");
        assert!(!session
            .entries
            .iter()
            .any(|entry| entry.role == "assistant"));
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn non_streaming_empty_completion_retries_once_and_persists_only_the_recovery() {
        let _guard = legacy_stream_test_lock().lock().await;
        let root = unique_legacy_storage_root("empty-non-streaming-retry");
        otherone_storage::localfile::set_storage_root(root);
        let session_id = otherone_storage::localfile::writer::create_new_session()
            .expect("create non-streaming retry session");
        let (base_url, server) = empty_then_valid_json_server().await;
        let observed_responses = Arc::new(AtomicUsize::new(0));
        let observed_responses_for_callback = Arc::clone(&observed_responses);
        let mut ai = test_ai_options();
        ai.base_url = base_url;
        ai.user_prompt = Some("recover an empty structured response".to_string());
        ai.stream = Some(false);
        ai.raw_chunk_observer = Some(Arc::new(move |_chunk| {
            let observed_responses = Arc::clone(&observed_responses_for_callback);
            async move {
                observed_responses.fetch_add(1, Ordering::SeqCst);
                Ok(())
            }
        }));
        let cancellation = CancellationToken::new();
        let mut handle = invoke_agent_stream_interactive_with_cancellation(
            legacy_stream_input(session_id.clone()),
            ai,
            None,
            cancellation,
        )
        .await
        .expect("start non-streaming retry run");

        let events = collect_legacy_events(&mut handle).await;
        handle.wait().await.expect("join non-streaming retry run");
        assert_eq!(
            events
                .iter()
                .filter(|event| event.event_type == "complete")
                .map(|event| event.content.as_str())
                .collect::<Vec<_>>(),
            vec!["recovered structured response"]
        );
        assert_eq!(
            events
                .iter()
                .filter(|event| event.event_type == "chunk")
                .count(),
            2
        );
        assert_eq!(observed_responses.load(Ordering::SeqCst), 2);
        assert_eq!(
            tokio::time::timeout(Duration::from_secs(5), server)
                .await
                .expect("JSON server did not stop")
                .expect("JSON server panicked"),
            2
        );

        let session = otherone_storage::localfile::reader::read_session_data(&session_id)
            .expect("read recovered session");
        let assistant_entries = session
            .entries
            .iter()
            .filter(|entry| entry.role == "assistant")
            .collect::<Vec<_>>();
        assert_eq!(assistant_entries.len(), 1);
        assert_eq!(
            assistant_entries[0].content,
            "recovered structured response"
        );
        assert_eq!(assistant_entries[0].token_consumption, Some(21));
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn empty_completion_is_observed_before_a_failed_retry() {
        let _guard = legacy_stream_test_lock().lock().await;
        let root = unique_legacy_storage_root("empty-response-observed-before-failed-retry");
        otherone_storage::localfile::set_storage_root(root);
        let session_id = otherone_storage::localfile::writer::create_new_session()
            .expect("create failed-retry session");
        let (base_url, server) = empty_then_error_json_server().await;
        let observed_responses = Arc::new(AtomicUsize::new(0));
        let observed_responses_for_callback = Arc::clone(&observed_responses);
        let mut ai = test_ai_options();
        ai.base_url = base_url;
        ai.user_prompt = Some("observe an empty response before retrying".to_string());
        ai.stream = Some(false);
        ai.raw_chunk_observer = Some(Arc::new(move |_chunk| {
            let observed_responses = Arc::clone(&observed_responses_for_callback);
            async move {
                observed_responses.fetch_add(1, Ordering::SeqCst);
                Ok(())
            }
        }));
        let cancellation = CancellationToken::new();
        let mut handle = invoke_agent_stream_interactive_with_cancellation(
            legacy_stream_input(session_id),
            ai,
            None,
            cancellation,
        )
        .await
        .expect("start failed-retry run");

        let events = collect_legacy_events(&mut handle).await;
        handle.wait().await.expect("join failed-retry run");
        assert_eq!(observed_responses.load(Ordering::SeqCst), 1);
        assert_eq!(
            events
                .iter()
                .filter(|event| event.event_type == "chunk")
                .count(),
            1
        );
        assert!(events.iter().any(|event| event.event_type == "error"));
        assert_eq!(
            tokio::time::timeout(Duration::from_secs(5), server)
                .await
                .expect("empty-then-error server did not stop")
                .expect("empty-then-error server panicked"),
            2
        );
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn cancelling_pending_call_sub_agent_stops_child_and_emits_one_terminal() {
        let _guard = legacy_stream_test_lock().lock().await;
        let root = unique_legacy_storage_root("pending-child-cancel");
        otherone_storage::localfile::set_storage_root(root);
        let session_id = otherone_storage::localfile::writer::create_new_session()
            .expect("create pending child session");
        let mut ai = test_ai_options();
        ai.base_url = tool_call_sse_server().await;
        ai.user_prompt = Some("delegate".to_string());
        ai.tools = Some(vec![otherone_ai::types::Tool {
            tool_type: "function".to_string(),
            function: otherone_ai::types::FunctionDefinition {
                name: "CallSubAgent".to_string(),
                description: "test child".to_string(),
                parameters: Some(serde_json::json!({ "type": "object" })),
            },
        }]);
        let cancellation = CancellationToken::new();
        let child_cancellation = cancellation.clone();
        let child_started = Arc::new(AtomicBool::new(false));
        let child_stopped = Arc::new(AtomicBool::new(false));
        let started = child_started.clone();
        let stopped = child_stopped.clone();
        ai.tools_realize = Some(HashMap::from([(
            "CallSubAgent".to_string(),
            Box::new(move |_: serde_json::Value, _tool_call_id: &str| {
                started.store(true, Ordering::SeqCst);
                while !child_cancellation.is_cancelled() {
                    std::thread::sleep(Duration::from_millis(5));
                }
                stopped.store(true, Ordering::SeqCst);
                "cancelled".to_string()
            }) as otherone_tools::ToolRealization,
        )]));
        let mut handle = invoke_agent_stream_interactive_with_cancellation(
            legacy_stream_input(session_id),
            ai,
            None,
            cancellation,
        )
        .await
        .expect("start pending child run");

        tokio::time::timeout(Duration::from_secs(5), async {
            while !child_started.load(Ordering::SeqCst) {
                tokio::time::sleep(Duration::from_millis(5)).await;
            }
        })
        .await
        .expect("CallSubAgent did not start");
        handle.cancel();
        let events = collect_legacy_events(&mut handle).await;
        handle.wait().await.expect("join pending child run");
        assert!(child_stopped.load(Ordering::SeqCst));
        assert_single_cancelled_terminal(&events);
        otherone_storage::localfile::clear_storage_root();
    }

    #[derive(Debug)]
    struct ResetThenFailExecutor(Arc<AtomicUsize>);
    impl otherone_ai::traits::ModelExecutor for ResetThenFailExecutor {
        fn stream(&self, config: serde_json::Value) -> otherone_ai::traits::ExecutionFuture<'_, otherone_ai::traits::ModelEventStream> {
            Box::pin(async move {
                use otherone_ai::traits::{ModelAttempt,ModelEvent,ModelEventStream};
                if self.0.fetch_add(1,Ordering::SeqCst)>0 {
                    assert!(config["messages"].as_array().unwrap().iter().any(|message|message["role"]=="tool"));
                    return Err(otherone_ai::error::AiError::Execution{code:"model_router_exhausted".into(),message:"exhausted".into()});
                }
                let attempt=|reset|ModelEvent::Attempt(ModelAttempt{request_id:"request".into(),attempt_id:format!("attempt-{reset}"),candidate_index:usize::from(reset),attempt_number:1,reset});
                let chunk=|args:&str,terminal:bool|ModelEvent::Chunk(serde_json::from_value(serde_json::json!({
                    "id":"provider-generation","choices":[{"index":0,"delta":{"role":"assistant","tool_calls":[{"index":0,"id":"call-once","type":"function","function":{"name":"CommitArtifact","arguments":args}}]},"finish_reason":if terminal {Some("tool_calls")}else{None}}]
                })).unwrap());
                Ok(Box::pin(futures::stream::iter(vec![Ok(attempt(false)),Ok(chunk("discard incomplete arguments",false)),Ok(attempt(true)),Ok(chunk("{}",true))])) as ModelEventStream)
            })
        }
    }

    #[tokio::test(flavor="multi_thread",worker_threads=2)]
    async fn injected_attempt_reset_preserves_completed_tool_exactly_once() {
        let _guard=legacy_stream_test_lock().lock().await;
        let artifacts=std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../../../../test/20260912-model-routing-v2").join(format!("sdk-tool-once-{}",std::process::id()));
        std::fs::create_dir_all(&artifacts).unwrap();
        otherone_storage::localfile::set_storage_root(artifacts);
        let session=otherone_storage::localfile::writer::create_new_session().unwrap();
        let requests=Arc::new(AtomicUsize::new(0));let commits=Arc::new(AtomicUsize::new(0));let committed=commits.clone();
        let mut ai=test_ai_options();ai.user_prompt=Some("commit".into());ai.stream=Some(true);
        ai.model_executor=Some(Arc::new(ResetThenFailExecutor(requests.clone())));
        ai.tools=Some(vec![otherone_ai::types::Tool{tool_type:"function".into(),function:otherone_ai::types::FunctionDefinition{name:"CommitArtifact".into(),description:"test".into(),parameters:Some(serde_json::json!({"type":"object"}))}}]);
        ai.tools_realize=Some(HashMap::from([("CommitArtifact".into(),Box::new(move |args:serde_json::Value,_id:&str|{assert_eq!(args,serde_json::json!({}));committed.fetch_add(1,Ordering::SeqCst);"committed".into()}) as otherone_tools::ToolRealization)]));
        let mut handle=invoke_agent_stream_interactive(legacy_stream_input(session),ai,None).await.unwrap();
        let events=collect_legacy_events(&mut handle).await;handle.wait().await.unwrap();
        assert_eq!(commits.load(Ordering::SeqCst),1);assert_eq!(requests.load(Ordering::SeqCst),2);
        assert!(events.iter().any(|event|event.event_type=="error"));
        otherone_storage::localfile::clear_storage_root();
    }

    #[test]
    fn test_build_ai_config_basic() {
        let ai = AiOptions {
            provider: otherone_ai::types::ProviderType::OpenAI,
            api_key: "test-key".to_string(),
            base_url: "https://api.openai.com/v1".to_string(),
            model: "gpt-4".to_string(),
            user_prompt: None,
            user_message: None,
            system_prompt: None,
            messages: None,
            context_length: Some(4096),
            temperature: Some(0.7),
            top_p: None,
            tools: None,
            tool_registry: None,
            terminal_tools: Vec::new(),
            tools_realize: None,
            tool_choice: None,
            required_terminal_tool: None,
            user_input_tool: None,
            parallel_tool_calls: None,
            stream: None,
            other: None,
            message_resolver: None,
            raw_chunk_observer: None,
            model_executor: None,
            compact_executor: None,
        };

        let messages = vec![];
        let config = build_ai_config(&ai, &messages);

        assert_eq!(config["model"], "gpt-4");
        assert_eq!(config["contextLength"], 4096);
        assert!((config["temperature"].as_f64().unwrap() - 0.7).abs() < 0.001);
    }

    #[test]
    fn typed_user_message_metadata_preserves_custom_and_structured_content() {
        let content = otherone_ai::types::MessageContent::MultiPart(vec![
            otherone_ai::types::ContentPart::text("inspect"),
            otherone_ai::types::ContentPart::image_url("otherone-media://image/1", None),
        ]);
        let message = UserMessageInput::new("inspect image.png", content.clone())
            .with_metadata("attachment_id", serde_json::json!("attachment-1"));

        let metadata = user_message_metadata(&message).unwrap();
        assert_eq!(
            metadata.get("attachment_id"),
            Some(&serde_json::json!("attachment-1"))
        );
        assert_eq!(
            metadata.get(otherone_storage::types::MESSAGE_CONTENT_METADATA_KEY),
            Some(&serde_json::to_value(content).unwrap())
        );
    }

    #[test]
    fn typed_initial_message_takes_precedence_and_legacy_prompt_still_works() {
        let mut ai = test_ai_options();
        ai.user_prompt = Some("legacy".to_string());
        assert_eq!(
            initial_user_message(&ai).unwrap().message_content,
            otherone_ai::types::MessageContent::Text("legacy".to_string())
        );

        ai.user_message = Some(UserMessageInput::new(
            "typed display",
            otherone_ai::types::MessageContent::MultiPart(vec![
                otherone_ai::types::ContentPart::video_url("otherone-media://video/1"),
            ]),
        ));
        let selected = initial_user_message(&ai).unwrap();
        assert_eq!(selected.display_content, "typed display");
        assert!(matches!(
            selected.message_content,
            otherone_ai::types::MessageContent::MultiPart(_)
        ));
    }

    #[test]
    fn latest_persisted_user_content_can_drive_memory_fallback() {
        let messages = vec![
            otherone_ai::types::Message { reasoning_content: None,
                role: "user".to_string(),
                content: otherone_ai::types::MessageContent::Text("older".to_string()),
                name: None,
                tool_calls: None,
                tool_call_id: None,
            },
            otherone_ai::types::Message { reasoning_content: None,
                role: "assistant".to_string(),
                content: otherone_ai::types::MessageContent::Text("answer".to_string()),
                name: None,
                tool_calls: None,
                tool_call_id: None,
            },
            otherone_ai::types::Message { reasoning_content: None,
                role: "user".to_string(),
                content: otherone_ai::types::MessageContent::MultiPart(vec![
                    otherone_ai::types::ContentPart::text("latest prompt"),
                    otherone_ai::types::ContentPart::image_url("internal:image", None),
                ]),
                name: None,
                tool_calls: None,
                tool_call_id: None,
            },
        ];

        assert_eq!(
            latest_user_display_content(&messages).as_deref(),
            Some("latest prompt")
        );
    }

    #[tokio::test]
    async fn typed_and_legacy_stream_commands_share_one_fifo_queue() {
        let (tx, mut rx) = mpsc::channel(4);
        tx.send(AgentStreamCommand::EnqueueUserPrompts(vec![
            " first ".to_string(),
            " ".to_string(),
        ]))
        .await
        .unwrap();
        tx.send(AgentStreamCommand::EnqueueUserMessages(vec![
            UserMessageInput::new(
                "second",
                otherone_ai::types::MessageContent::MultiPart(vec![
                    otherone_ai::types::ContentPart::input_audio("otherone-media://audio/1", "mp3"),
                ]),
            ),
        ]))
        .await
        .unwrap();

        let mut queued = VecDeque::new();
        drain_agent_commands(&mut rx, &mut queued);

        assert_eq!(queued.len(), 2);
        assert_eq!(queued[0].message.display_content, "first");
        assert_eq!(queued[1].message.display_content, "second");
        assert!(matches!(
            queued[1].message.message_content,
            otherone_ai::types::MessageContent::MultiPart(_)
        ));
    }

    #[tokio::test]
    async fn acknowledged_stream_command_acks_only_after_successful_persistence() {
        let (tx, mut rx) = mpsc::channel(1);
        let (persisted_tx, mut persisted_rx) = tokio::sync::oneshot::channel();
        tx.send(AgentStreamCommand::EnqueueUserMessagesWithAck(vec![
            AcknowledgedUserMessage {
                message: UserMessageInput::text("queued"),
                persisted: persisted_tx,
            },
        ]))
        .await
        .unwrap();

        let mut queued = VecDeque::new();
        drain_agent_commands(&mut rx, &mut queued);

        assert_eq!(queued.len(), 1);
        assert!(matches!(
            persisted_rx.try_recv(),
            Err(tokio::sync::oneshot::error::TryRecvError::Empty)
        ));
        let written = write_queued_user_messages_with(&mut queued, |_| async { Ok(()) })
            .await
            .unwrap();
        assert_eq!(written, 1);
        assert!(queued.is_empty());
        assert_eq!(persisted_rx.await, Ok(()));
    }

    #[tokio::test]
    async fn acknowledged_stream_command_does_not_ack_failed_persistence() {
        let (tx, mut rx) = mpsc::channel(1);
        let (persisted_tx, mut persisted_rx) = tokio::sync::oneshot::channel();
        tx.send(AgentStreamCommand::EnqueueUserMessagesWithAck(vec![
            AcknowledgedUserMessage {
                message: UserMessageInput::text("queued"),
                persisted: persisted_tx,
            },
        ]))
        .await
        .unwrap();

        let mut queued = VecDeque::new();
        drain_agent_commands(&mut rx, &mut queued);
        let result = write_queued_user_messages_with(&mut queued, |_| async {
            Err(AgentError::ContextError("write failed".to_string()))
        })
        .await;

        assert!(result.is_err());
        assert_eq!(queued.len(), 1);
        assert!(matches!(
            persisted_rx.try_recv(),
            Err(tokio::sync::oneshot::error::TryRecvError::Empty)
        ));
        drop(queued);
        assert!(persisted_rx.await.is_err());
    }

    #[tokio::test]
    async fn acknowledged_empty_message_is_rejected_without_ack() {
        let (tx, mut rx) = mpsc::channel(1);
        let (persisted_tx, persisted_rx) = tokio::sync::oneshot::channel();
        tx.send(AgentStreamCommand::EnqueueUserMessagesWithAck(vec![
            AcknowledgedUserMessage {
                message: UserMessageInput::text("   "),
                persisted: persisted_tx,
            },
        ]))
        .await
        .unwrap();

        let mut queued = VecDeque::new();
        drain_agent_commands(&mut rx, &mut queued);

        assert!(queued.is_empty());
        assert!(persisted_rx.await.is_err());
    }

    #[tokio::test]
    async fn resolver_runs_fresh_for_each_model_iteration_without_mutating_history() {
        let calls = Arc::new(AtomicUsize::new(0));
        let resolver_calls = Arc::clone(&calls);
        let mut ai = test_ai_options();
        ai.message_resolver = Some(Arc::new(
            move |mut messages: Vec<otherone_ai::types::Message>| {
                let call = resolver_calls.fetch_add(1, Ordering::SeqCst) + 1;
                async move {
                    if let Some(otherone_ai::types::Message { reasoning_content: None,
                        content: otherone_ai::types::MessageContent::MultiPart(parts),
                        ..
                    }) = messages.first_mut()
                    {
                        parts[0].image_url.as_mut().unwrap().url =
                            format!("https://signed.example/{call}");
                    }
                    Ok(messages)
                }
            },
        ));
        let stored_messages = vec![otherone_ai::types::Message { reasoning_content: None,
            role: "user".to_string(),
            content: otherone_ai::types::MessageContent::MultiPart(vec![
                otherone_ai::types::ContentPart::image_url("otherone-media://image/1", None),
            ]),
            name: None,
            tool_calls: None,
            tool_call_id: None,
        }];

        let first = resolve_messages_for_model(&ai, stored_messages.clone())
            .await
            .unwrap();
        let second = resolve_messages_for_model(&ai, stored_messages.clone())
            .await
            .unwrap();

        assert_eq!(calls.load(Ordering::SeqCst), 2);
        let resolved_url = |messages: &[otherone_ai::types::Message]| match &messages[0].content {
            otherone_ai::types::MessageContent::MultiPart(parts) => {
                parts[0].image_url.as_ref().unwrap().url.clone()
            }
            _ => panic!("expected multipart content"),
        };
        assert_eq!(resolved_url(&first), "https://signed.example/1");
        assert_eq!(resolved_url(&second), "https://signed.example/2");
        assert_eq!(resolved_url(&stored_messages), "otherone-media://image/1");
    }

    #[test]
    fn configure_long_term_memory_adds_prompt_tool_and_handler() {
        let mut ai = AiOptions {
            provider: otherone_ai::types::ProviderType::OpenAI,
            api_key: "test-key".to_string(),
            base_url: "https://api.openai.com/v1".to_string(),
            model: "gpt-4".to_string(),
            user_prompt: None,
            user_message: None,
            system_prompt: Some("You are helpful.".to_string()),
            messages: None,
            context_length: None,
            temperature: None,
            top_p: None,
            tools: None,
            tool_registry: None,
            terminal_tools: Vec::new(),
            tools_realize: None,
            tool_choice: None,
            required_terminal_tool: None,
            user_input_tool: None,
            parallel_tool_calls: None,
            stream: None,
            other: None,
            message_resolver: None,
            raw_chunk_observer: None,
            model_executor: None,
            compact_executor: None,
        };

        let queue: LongTermMemoryQueue = Arc::new(Mutex::new(Vec::new()));

        configure_long_term_memory(&mut ai, Arc::clone(&queue), 4);
        configure_long_term_memory(&mut ai, Arc::clone(&queue), 4);

        let system_prompt = ai.system_prompt.as_deref().unwrap();
        assert!(system_prompt.contains("You are helpful."));
        assert_eq!(
            system_prompt
                .matches(LONG_TERM_MEMORY_SYSTEM_PROMPT)
                .count(),
            1
        );

        let tools = ai.tools.as_ref().unwrap();
        assert_eq!(
            tools
                .iter()
                .filter(|tool| tool.function.name == LONG_TERM_MEMORY_TOOL_NAME)
                .count(),
            1
        );
        assert_eq!(
            tools
                .iter()
                .filter(|tool| tool.function.name == LONG_TERM_MEMORY_RECALL_TOOL_NAME)
                .count(),
            1
        );
        let add_tool = tools
            .iter()
            .find(|tool| tool.function.name == LONG_TERM_MEMORY_TOOL_NAME)
            .unwrap();
        assert!(add_tool
            .function
            .parameters
            .as_ref()
            .unwrap()
            .to_string()
            .contains("possible_parent_types"));
        let recall_tool = tools
            .iter()
            .find(|tool| tool.function.name == LONG_TERM_MEMORY_RECALL_TOOL_NAME)
            .unwrap();
        assert_eq!(
            recall_tool.function.parameters.as_ref().unwrap()["properties"]["memory_types"]
                ["maxItems"],
            serde_json::json!(4)
        );

        let tool_calls = vec![otherone_ai::types::ToolCall {
            index: None,
            id: "call_memory".to_string(),
            call_type: "function".to_string(),
            function: otherone_ai::types::FunctionCall {
                name: LONG_TERM_MEMORY_TOOL_NAME.to_string(),
                arguments:
                    r#"{"storage":"用户喜欢炸酱面","types":"用户喜欢吃的面食","possible_parent_types":["饮食","面食"]}"#
                        .to_string(),
            },
        }];

        let results =
            otherone_tools::process_tools(&tool_calls, ai.tools_realize.as_ref().unwrap()).unwrap();

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].result, Some(serde_json::json!("done")));

        let pending_queue = queue.lock().unwrap();
        assert_eq!(pending_queue.len(), 1);
        assert_eq!(pending_queue[0].storage, "用户喜欢炸酱面");
        assert_eq!(pending_queue[0].possible_parent_types, vec!["饮食", "面食"]);
    }

    #[test]
    fn parse_pending_long_term_memory_sanitizes_fields() {
        let pending = parse_pending_long_term_memory(serde_json::json!({
            "storage": " 用户喜欢炸酱面 ",
            "types": " 用户喜欢吃的面食 ",
            "possible_parent_types": [" 饮食 ", "", "面食", "面食"]
        }))
        .unwrap();

        assert_eq!(pending.storage, "用户喜欢炸酱面");
        assert_eq!(pending.types, "用户喜欢吃的面食");
        assert_eq!(pending.possible_parent_types, vec!["饮食", "面食"]);

        let fallback = parse_pending_long_term_memory(serde_json::json!({
            "storage": "用户喜欢游泳",
            "types": "运动偏好",
            "possible_parent_types": []
        }))
        .unwrap();
        assert_eq!(fallback.possible_parent_types, vec!["运动偏好"]);
    }

    #[test]
    fn recalls_long_term_memory_storage_only() {
        let root = std::env::temp_dir().join(format!(
            "otherone-agent-recall-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        otherone_memory::set_memory_storage_root(root);

        let mut tree = otherone_memory::MemoryTree::new();
        let food = tree
            .insert_root("用户喜欢吃炸酱面和糖醋排骨等食物", "用户喜欢的食物")
            .unwrap();
        tree.insert_child(&food, "用户喜欢吃糖醋排骨", "用户喜欢吃的菜")
            .unwrap();
        tree.insert_root("用户周末喜欢跑步", "运动习惯").unwrap();
        otherone_memory::write_memory_tree(&tree).unwrap();

        let result = recall_long_term_memory_inner(
            serde_json::json!({
                "memory_types": ["食物偏好", "食物偏好", "运动习惯"]
            }),
            1,
        )
        .unwrap();

        assert!(result.contains("<long-term-memory>"));
        assert!(result.contains("- 用户喜欢吃炸酱面和糖醋排骨等食物"));
        assert!(result.contains("- 用户喜欢吃糖醋排骨"));
        assert!(!result.contains("point_id"));
        assert!(!result.contains("用户周末喜欢跑步"));

        otherone_memory::clear_memory_storage_root();
    }

    #[test]
    fn recall_max_types_is_clamped() {
        assert_eq!(
            normalize_recall_max_types(None),
            DEFAULT_LONG_TERM_MEMORY_RECALL_MAX_TYPES
        );
        assert_eq!(normalize_recall_max_types(Some(0)), 1);
        assert_eq!(
            normalize_recall_max_types(Some(usize::MAX)),
            MAX_LONG_TERM_MEMORY_RECALL_MAX_TYPES
        );
    }

    #[test]
    fn applies_insert_root_memory_commit() {
        let mut tree = otherone_memory::MemoryTree::new();
        let args = LongTermMemoryCommitArgs {
            action: "insert_root".to_string(),
            storage: Some("用户喜欢炸酱面".to_string()),
            types: Some("用户喜欢吃的面食".to_string()),
            parent_id: None,
            target_id: None,
            parent_storage: None,
            parent_types: None,
        };

        apply_long_term_memory_commit(&mut tree, &args).unwrap();

        assert_eq!(tree.memory_len(), 1);
        let root = tree.get(&tree.root_ids()[0]).unwrap();
        assert_eq!(root.storage.as_deref(), Some("用户喜欢炸酱面"));
        assert_eq!(root.types.as_deref(), Some("用户喜欢吃的面食"));
    }

    #[test]
    fn applies_update_parent_and_insert_child_memory_commit() {
        let mut tree = otherone_memory::MemoryTree::new();
        let parent_id = tree
            .insert_root("用户喜欢炸酱面", "用户喜欢吃的面食")
            .unwrap();
        let args = LongTermMemoryCommitArgs {
            action: "update_parent_and_insert_child".to_string(),
            storage: Some("用户喜欢糖醋排骨".to_string()),
            types: Some("用户喜欢吃的菜".to_string()),
            parent_id: Some(parent_id.clone()),
            target_id: None,
            parent_storage: Some("用户喜欢炸酱面和糖醋排骨".to_string()),
            parent_types: Some("用户喜欢吃的食物".to_string()),
        };

        apply_long_term_memory_commit(&mut tree, &args).unwrap();

        let parent = tree.get(&parent_id).unwrap();
        assert_eq!(parent.storage.as_deref(), Some("用户喜欢炸酱面和糖醋排骨"));
        assert_eq!(parent.types.as_deref(), Some("用户喜欢吃的食物"));

        let child_ids = tree.child_ids(&parent_id).unwrap();
        assert_eq!(child_ids.len(), 1);
        let child = tree.get(&child_ids[0]).unwrap();
        assert_eq!(child.storage.as_deref(), Some("用户喜欢糖醋排骨"));
        assert_eq!(child.types.as_deref(), Some("用户喜欢吃的菜"));
    }

    #[test]
    fn update_parent_and_insert_child_preserves_old_specific_parent_storage() {
        let mut tree = otherone_memory::MemoryTree::new();
        let parent_id = tree
            .insert_root("用户喜欢吃炸酱面", "用户喜欢吃的面食")
            .unwrap();
        let args = LongTermMemoryCommitArgs {
            action: "update_parent_and_insert_child".to_string(),
            storage: Some("用户不喜欢吃香菜".to_string()),
            types: Some("用户不喜欢的食材".to_string()),
            parent_id: Some(parent_id.clone()),
            target_id: None,
            parent_storage: Some("用户有关于食物的喜好和禁忌信息".to_string()),
            parent_types: Some("用户的食物偏好与限制".to_string()),
        };

        apply_long_term_memory_commit(&mut tree, &args).unwrap();

        let parent = tree.get(&parent_id).unwrap();
        assert_eq!(
            parent.storage.as_deref(),
            Some("用户有关于食物的喜好和禁忌信息")
        );

        let child_storages = tree
            .children(&parent_id)
            .unwrap()
            .into_iter()
            .filter_map(|point| point.storage.as_deref())
            .collect::<Vec<_>>();
        assert!(child_storages.contains(&"用户喜欢吃炸酱面"));
        assert!(child_storages.contains(&"用户不喜欢吃香菜"));
    }

    #[test]
    fn applies_update_existing_memory_commit() {
        let mut tree = otherone_memory::MemoryTree::new();
        let point_id = tree.insert_root("用户喜欢面食", "饮食偏好").unwrap();
        let args = LongTermMemoryCommitArgs {
            action: "update_existing".to_string(),
            storage: Some("用户喜欢炸酱面等面食".to_string()),
            types: Some("用户喜欢吃的面食".to_string()),
            parent_id: None,
            target_id: Some(point_id.clone()),
            parent_storage: None,
            parent_types: None,
        };

        apply_long_term_memory_commit(&mut tree, &args).unwrap();

        let point = tree.get(&point_id).unwrap();
        assert_eq!(point.storage.as_deref(), Some("用户喜欢炸酱面等面食"));
        assert_eq!(point.types.as_deref(), Some("用户喜欢吃的面食"));
    }

    #[test]
    fn applies_ignore_memory_commit_without_changing_tree() {
        let mut tree = otherone_memory::MemoryTree::new();
        let before = tree.to_points();
        let args = LongTermMemoryCommitArgs {
            action: "ignore".to_string(),
            storage: Some("验证码是 123456".to_string()),
            types: Some("验证码".to_string()),
            parent_id: None,
            target_id: None,
            parent_storage: None,
            parent_types: None,
        };

        apply_long_term_memory_commit(&mut tree, &args).unwrap();

        assert_eq!(tree.memory_len(), 0);
        assert_eq!(tree.to_points().len(), before.len());
    }

    #[test]
    fn heuristic_fallback_detects_durable_memory_cues() {
        assert!(should_queue_long_term_memory_fallback(
            "我叫林澈，这是可以长期记住的称呼。"
        ));
        assert!(should_queue_long_term_memory_fallback(
            "我长期不吃辣，点餐时可以参考。"
        ));
        assert!(should_queue_long_term_memory_fallback(
            "以后和我交流默认用中文。"
        ));
    }

    #[test]
    fn heuristic_fallback_rejects_temporary_and_sensitive_cues() {
        assert!(!should_queue_long_term_memory_fallback(
            "这次当前页面的按钮先临时改成红色。"
        ));
        assert!(!should_queue_long_term_memory_fallback(
            "我的银行卡验证码是 123456，这个不要长期记住。"
        ));
        assert!(!should_queue_long_term_memory_fallback(
            "把“今天项目进展顺利”翻译成英文。"
        ));
        assert!(!should_queue_long_term_memory_fallback(
            "再次提醒，我喜欢吃炸酱面。如果已经记住就不用新增重复节点。"
        ));
    }

    #[test]
    fn merge_tool_call_delta_uses_index_for_streamed_arguments() {
        let mut calls = Vec::new();

        merge_tool_call_delta(
            &mut calls,
            &otherone_ai::types::ToolCall {
                index: Some(0),
                id: "call_1".to_string(),
                call_type: "function".to_string(),
                function: otherone_ai::types::FunctionCall {
                    name: "read_file".to_string(),
                    arguments: String::new(),
                },
            },
        );
        merge_tool_call_delta(
            &mut calls,
            &otherone_ai::types::ToolCall {
                index: Some(0),
                id: String::new(),
                call_type: "function".to_string(),
                function: otherone_ai::types::FunctionCall {
                    name: String::new(),
                    arguments: "{\"path\":\"Cargo".to_string(),
                },
            },
        );
        merge_tool_call_delta(
            &mut calls,
            &otherone_ai::types::ToolCall {
                index: Some(0),
                id: String::new(),
                call_type: "function".to_string(),
                function: otherone_ai::types::FunctionCall {
                    name: String::new(),
                    arguments: ".toml\"}".to_string(),
                },
            },
        );

        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].id, "call_1");
        assert_eq!(calls[0].function.name, "read_file");
        assert_eq!(calls[0].function.arguments, "{\"path\":\"Cargo.toml\"}");
    }
}

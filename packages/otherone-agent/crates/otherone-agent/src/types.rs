use otherone_ai::types::{Message, MessageContent};
use otherone_storage::types::{AttributeBag, DatabaseConfig, RuntimeContext};
use serde::{Deserialize, Serialize};
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio::task::JoinHandle;
use tokio_util::sync::CancellationToken;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ContextLoadType {
    Database,
    LocalFile,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StorageType {
    LocalFile,
    Database,
}

#[derive(Debug, Clone)]
pub struct InputOptions {
    pub session_id: String,
    pub context_load_type: ContextLoadType,
    pub storage_type: Option<StorageType>,
    pub database_config: Option<DatabaseConfig>,
    pub runtime_context: Option<RuntimeContext>,
    pub context_window: u32,
    pub threshold_percentage: Option<f32>,
    pub max_iterations: Option<u32>,
    pub enable_long_term_memory: Option<bool>,
    pub long_term_memory_recall_max_types: Option<usize>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
/// A user message whose UI/storage representation can differ from model content.
pub struct UserMessageInput {
    pub display_content: String,
    pub message_content: MessageContent,
    #[serde(default)]
    pub metadata: AttributeBag,
}

impl UserMessageInput {
    pub fn new(display_content: impl Into<String>, message_content: MessageContent) -> Self {
        Self {
            display_content: display_content.into(),
            message_content,
            metadata: AttributeBag::new(),
        }
    }

    pub fn text(content: impl Into<String>) -> Self {
        let content = content.into();
        Self::new(content.clone(), MessageContent::Text(content))
    }

    pub fn with_metadata(mut self, key: impl Into<String>, value: serde_json::Value) -> Self {
        self.metadata.insert(key.into(), value);
        self
    }

    pub(crate) fn is_effectively_empty(&self) -> bool {
        match &self.message_content {
            MessageContent::Text(content) => {
                self.display_content.trim().is_empty() && content.trim().is_empty()
            }
            MessageContent::MultiPart(parts) => {
                self.display_content.trim().is_empty() && parts.is_empty()
            }
        }
    }
}

pub type MessageResolverFuture =
    Pin<Box<dyn Future<Output = Result<Vec<Message>, String>> + Send + 'static>>;

/// Resolves persisted/internal message references immediately before a model call.
pub trait MessageResolver: Send + Sync {
    fn resolve_messages(&self, messages: Vec<Message>) -> MessageResolverFuture;
}

impl<F, Fut> MessageResolver for F
where
    F: Fn(Vec<Message>) -> Fut + Send + Sync,
    Fut: Future<Output = Result<Vec<Message>, String>> + Send + 'static,
{
    fn resolve_messages(&self, messages: Vec<Message>) -> MessageResolverFuture {
        Box::pin((self)(messages))
    }
}

pub type RawChunkObserverFuture =
    Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'static>>;

/// Observes a provider chunk before the Agent can start its next model iteration.
pub trait RawChunkObserver: Send + Sync {
    fn observe_raw_chunk(&self, chunk: serde_json::Value) -> RawChunkObserverFuture;
    fn reset_model_attempt(&self) -> RawChunkObserverFuture { Box::pin(async { Ok(()) }) }
}

impl<F, Fut> RawChunkObserver for F
where
    F: Fn(serde_json::Value) -> Fut + Send + Sync,
    Fut: Future<Output = Result<(), String>> + Send + 'static,
{
    fn observe_raw_chunk(&self, chunk: serde_json::Value) -> RawChunkObserverFuture {
        Box::pin((self)(chunk))
    }
}

pub struct AiOptions {
    pub provider: otherone_ai::types::ProviderType,
    pub api_key: String,
    pub base_url: String,
    pub model: String,
    /// Legacy text-only initial message.
    pub user_prompt: Option<String>,
    /// Typed initial message. When set, this takes precedence over `user_prompt`.
    pub user_message: Option<UserMessageInput>,
    pub system_prompt: Option<String>,
    pub messages: Option<Vec<otherone_ai::types::Message>>,
    pub context_length: Option<u32>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub tools: Option<Vec<otherone_ai::types::Tool>>,
    pub tool_registry: Option<Arc<otherone_tools::ToolRegistry>>,
    /// Host-declared mutation tools whose committed receipt ends this turn.
    pub terminal_tools: Vec<String>,
    pub tools_realize: Option<otherone_tools::ToolRealizationMap>,
    pub tool_choice: Option<otherone_ai::types::ToolChoice>,
    /// A tool that must complete successfully before the Agent may finish.
    ///
    /// The Agent may use other tools first. If it tries to finish early, the
    /// runtime retries once with this exact function selected. After the
    /// required tool succeeds, tools are disabled for the final response.
    pub required_terminal_tool: Option<String>,
    /// A host-declared interaction tool. An awaiting_user receipt ends the turn
    /// after durable tool storage, without another model call or cancellation.
    pub user_input_tool: Option<String>,
    pub parallel_tool_calls: Option<bool>,
    pub stream: Option<bool>,
    pub other: Option<serde_json::Value>,
    /// Ephemerally resolves internal message references before every provider call.
    pub message_resolver: Option<Arc<dyn MessageResolver>>,
    /// Persists billing/telemetry facts before another provider iteration may begin.
    pub raw_chunk_observer: Option<Arc<dyn RawChunkObserver>>,
    pub model_executor: Option<Arc<dyn otherone_ai::traits::ModelExecutor>>,
    pub compact_executor: Option<Arc<dyn otherone_ai::traits::ModelExecutor>>,
}

#[derive(Debug, Clone)]
pub struct StreamAgentEvent {
    pub event_type: String,
    pub content: String,
    pub raw_chunk: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[derive(Debug)]
pub struct AcknowledgedUserMessage {
    pub message: UserMessageInput,
    pub persisted: tokio::sync::oneshot::Sender<()>,
}

#[derive(Debug)]
pub enum AgentStreamCommand {
    /// Legacy text-only queue command.
    EnqueueUserPrompts(Vec<String>),
    /// Typed queue command supporting structured multimodal content and metadata.
    EnqueueUserMessages(Vec<UserMessageInput>),
    /// Typed messages with acknowledgements that resolve only after durable entry writes.
    EnqueueUserMessagesWithAck(Vec<AcknowledgedUserMessage>),
}

pub struct AgentStreamHandle {
    events: mpsc::Receiver<StreamAgentEvent>,
    commands: mpsc::Sender<AgentStreamCommand>,
    cancellation: CancellationToken,
    task: Option<JoinHandle<()>>,
    finished: bool,
}

impl AgentStreamHandle {
    pub(crate) fn new(
        events: mpsc::Receiver<StreamAgentEvent>,
        commands: mpsc::Sender<AgentStreamCommand>,
        cancellation: CancellationToken,
        task: JoinHandle<()>,
    ) -> Self {
        Self {
            events,
            commands,
            cancellation,
            task: Some(task),
            finished: false,
        }
    }

    pub async fn recv(&mut self) -> Option<StreamAgentEvent> {
        self.events.recv().await
    }

    pub fn commands(&self) -> mpsc::Sender<AgentStreamCommand> {
        self.commands.clone()
    }

    pub fn cancellation_token(&self) -> CancellationToken {
        self.cancellation.clone()
    }

    pub fn cancel(&self) {
        self.cancellation.cancel();
    }

    pub async fn wait(&mut self) -> Result<(), tokio::task::JoinError> {
        match self.task.take() {
            Some(task) => {
                let result = task.await;
                self.finished = result.is_ok();
                result
            }
            None => Ok(()),
        }
    }
}

impl Drop for AgentStreamHandle {
    fn drop(&mut self) {
        if !self.finished {
            self.cancellation.cancel();
        }
        if let Some(task) = self.task.take() {
            task.abort();
        }
    }
}

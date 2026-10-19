use std::collections::{HashMap, VecDeque};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Weak};
use std::time::{Duration, Instant};

use async_trait::async_trait;
use futures::future::join_all;
use futures::{FutureExt, StreamExt};
use otherone_ai::error::AiError;
use otherone_ai::traits::ChatStream;
use otherone_ai::types::{FunctionDefinition, Message, MessageContent, Tool, ToolCall};
use otherone_storage::types::{AttributeBag, StorageType as StorageBackend, WriteEntryOptions};
use otherone_tools::types::{
    ToolCallContext, ToolError, ToolErrorKind, ToolExecutionClass, ToolResult,
};
use otherone_tools::{ToolHandler, ToolRegistration, ToolRegistry};
use serde::Deserialize;
use tokio::sync::{mpsc, oneshot, Mutex, Notify};
use tokio_util::sync::CancellationToken;

use crate::error::AgentError;
use crate::types::{ContextLoadType, StorageType};

use super::event::EventBus;
use super::registry::{
    validate_snapshot, AgentRegistry, ModelRegistry, RuntimePolicy, RuntimeSnapshot,
    SkillRegistrySnapshot, AGENT_CALL_TOOL_NAME, MEMORY_RECALL_TOOL_NAME, MEMORY_STORE_TOOL_NAME,
};
use super::supervisor::{BudgetLedger, InMemoryRunStore, RunContext, RunSupervisor, SessionLease};
use super::types::{
    merge_other, metadata_with_lineage, AgentCallId, AgentCallRequest, AgentCallResult,
    AgentDefinition, AgentEvent, AgentFailure, AgentId, AgentInput, AgentOutput, AgentRunCommand,
    AgentRunContextView, AgentRunRequest, AgentRunResult, EffectiveLimits, MemoryPolicy,
    ModelProfile, ModelProfileId, ResultContract, RunId, RunOutcome, RunRecord, RunStatus,
    RunUsage, RuntimeLimits,
};

const EVENT_CHANNEL_CAPACITY: usize = 512;
const COMMAND_CHANNEL_CAPACITY: usize = 64;
const ROOT_IDEMPOTENCY_CACHE_CAPACITY: usize = 1024;

#[async_trait]
pub trait ModelExecutor: Send + Sync {
    async fn stream(
        &self,
        profile: &ModelProfile,
        config: serde_json::Value,
    ) -> Result<ChatStream, AiError>;
}

#[derive(Default)]
pub struct DefaultModelExecutor;

#[async_trait]
impl ModelExecutor for DefaultModelExecutor {
    async fn stream(
        &self,
        profile: &ModelProfile,
        config: serde_json::Value,
    ) -> Result<ChatStream, AiError> {
        otherone_ai::invoke_model_stream(
            profile.provider.clone(),
            profile.api_key(),
            &profile.base_url,
            config,
        )
        .await
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AuthorizationDecision {
    Allow,
    Deny(String),
}

#[async_trait]
pub trait AgentCallAuthorizer: Send + Sync {
    async fn authorize(
        &self,
        caller: &AgentRunContextView,
        target: &AgentDefinition,
        request: &AgentCallRequest,
    ) -> Result<AuthorizationDecision, AgentError>;
}

#[derive(Default)]
struct AllowAllAuthorizer;

#[async_trait]
impl AgentCallAuthorizer for AllowAllAuthorizer {
    async fn authorize(
        &self,
        _caller: &AgentRunContextView,
        _target: &AgentDefinition,
        _request: &AgentCallRequest,
    ) -> Result<AuthorizationDecision, AgentError> {
        Ok(AuthorizationDecision::Allow)
    }
}

pub struct AgentRuntimeBuilder {
    agents: Vec<AgentDefinition>,
    models: Vec<ModelProfile>,
    tools: Vec<ToolRegistration>,
    skills: SkillRegistrySnapshot,
    default_model: Option<ModelProfileId>,
    policy: RuntimePolicy,
    limits: RuntimeLimits,
    model_executor: Arc<dyn ModelExecutor>,
    authorizer: Arc<dyn AgentCallAuthorizer>,
}

impl Default for AgentRuntimeBuilder {
    fn default() -> Self {
        Self {
            agents: Vec::new(),
            models: Vec::new(),
            tools: Vec::new(),
            skills: SkillRegistrySnapshot::default(),
            default_model: None,
            policy: RuntimePolicy::default(),
            limits: RuntimeLimits::default(),
            model_executor: Arc::new(DefaultModelExecutor),
            authorizer: Arc::new(AllowAllAuthorizer),
        }
    }
}

impl AgentRuntimeBuilder {
    pub fn register_agent(mut self, definition: AgentDefinition) -> Self {
        self.agents.push(definition);
        self
    }

    pub fn register_model(mut self, profile: ModelProfile) -> Self {
        self.models.push(profile);
        self
    }

    pub fn register_tool(mut self, registration: ToolRegistration) -> Self {
        self.tools.push(registration);
        self
    }

    pub fn skills(mut self, registry: &otherone_skills::SkillRegistry) -> Self {
        self.skills = SkillRegistrySnapshot::from_registry(registry);
        self
    }

    pub fn default_model(mut self, id: impl Into<String>) -> Self {
        self.default_model = Some(ModelProfileId::unchecked(id));
        self
    }

    pub fn policy(mut self, policy: RuntimePolicy) -> Self {
        self.policy = policy;
        self
    }

    pub fn runtime_limits(mut self, limits: RuntimeLimits) -> Self {
        self.limits = limits;
        self
    }

    pub fn model_executor(mut self, executor: Arc<dyn ModelExecutor>) -> Self {
        self.model_executor = executor;
        self
    }

    pub fn authorizer(mut self, authorizer: Arc<dyn AgentCallAuthorizer>) -> Self {
        self.authorizer = authorizer;
        self
    }

    pub fn build(self) -> Result<AgentRuntime, AgentError> {
        self.limits.validate()?;

        let mut agents = AgentRegistry::new();
        for definition in self.agents {
            agents.register(definition)?;
        }

        let mut models = ModelRegistry::new();
        for profile in self.models {
            models.register(profile)?;
        }

        let default_model = match self.default_model {
            Some(id) => {
                id.validate()?;
                id
            }
            None => models.ids().into_iter().next().ok_or_else(|| {
                AgentError::InvalidConfiguration(
                    "at least one model profile must be registered".to_string(),
                )
            })?,
        };

        let mut user_tools = ToolRegistry::new();
        for registration in self.tools {
            if matches!(
                registration.name(),
                AGENT_CALL_TOOL_NAME | MEMORY_RECALL_TOOL_NAME | MEMORY_STORE_TOOL_NAME
            ) {
                return Err(AgentError::InvalidConfiguration(format!(
                    "tool name '{}' is reserved by Otherone",
                    registration.name()
                )));
            }
            user_tools
                .register(registration)
                .map_err(|error| AgentError::InvalidConfiguration(error.to_string()))?;
        }

        let agent_snapshot = Arc::new(agents.snapshot());
        let model_snapshot = Arc::new(models.snapshot());
        let skill_snapshot = Arc::new(self.skills);
        let policy = Arc::new(self.policy);
        let limits = self.limits;
        let model_executor = self.model_executor;
        let authorizer = self.authorizer;

        let inner = Arc::new_cyclic(|weak| {
            let mut tools = user_tools.clone();
            tools
                .register(agent_call_registration(weak.clone()))
                .expect("reserved agent call tool must register");

            let memory_lock = global_memory_lock();
            tools
                .register(memory_recall_registration(Arc::clone(&memory_lock)))
                .expect("reserved memory recall tool must register");
            tools
                .register(memory_store_registration(memory_lock))
                .expect("reserved memory store tool must register");

            let snapshot = Arc::new(RuntimeSnapshot {
                version: uuid::Uuid::new_v4().to_string(),
                default_model: default_model.clone(),
                agents: Arc::clone(&agent_snapshot),
                models: Arc::clone(&model_snapshot),
                tools: Arc::new(tools),
                skills: Arc::clone(&skill_snapshot),
                policy: Arc::clone(&policy),
            });

            RuntimeInner {
                snapshot,
                supervisor: RunSupervisor::new(&limits),
                limits: limits.clone(),
                model_executor: Arc::clone(&model_executor),
                authorizer: Arc::clone(&authorizer),
                call_slots: Mutex::new(HashMap::new()),
                root_slots: Mutex::new(HashMap::new()),
            }
        });

        validate_snapshot(&inner.snapshot)?;
        Ok(AgentRuntime { inner })
    }
}

#[derive(Clone)]
pub struct AgentRuntime {
    inner: Arc<RuntimeInner>,
}

impl AgentRuntime {
    pub fn builder() -> AgentRuntimeBuilder {
        AgentRuntimeBuilder::default()
    }

    pub fn snapshot(&self) -> Arc<RuntimeSnapshot> {
        Arc::clone(&self.inner.snapshot)
    }

    pub fn run_store(&self) -> InMemoryRunStore {
        self.inner.supervisor.run_store.clone()
    }

    pub async fn run(&self, mut request: AgentRunRequest) -> Result<AgentRunResult, AgentError> {
        let Some(idempotency_key) = request.idempotency_key.take() else {
            return self.start_internal(request).await?.result().await;
        };
        if idempotency_key.is_empty() || idempotency_key.len() > 256 {
            return Err(AgentError::InvalidConfiguration(
                "idempotency_key must contain 1-256 characters".to_string(),
            ));
        }
        validate_root_request(&request)?;
        let key = RootCallKey {
            partition_key: request
                .runtime_context
                .as_ref()
                .map(|context| context.partition_key.clone())
                .unwrap_or_else(|| "local".to_string()),
            idempotency_key,
        };
        let (slot, should_start) = {
            let mut slots = self.inner.root_slots.lock().await;
            if !slots.contains_key(&key) && slots.len() >= ROOT_IDEMPOTENCY_CACHE_CAPACITY {
                if let Some(completed_key) = slots
                    .iter()
                    .find_map(|(key, slot)| slot.is_complete().then(|| key.clone()))
                {
                    slots.remove(&completed_key);
                } else {
                    return Err(AgentError::BudgetExceeded(
                        "root_idempotency_cache_capacity".to_string(),
                    ));
                }
            }
            match slots.entry(key) {
                std::collections::hash_map::Entry::Occupied(entry) => {
                    (Arc::clone(entry.get()), false)
                }
                std::collections::hash_map::Entry::Vacant(entry) => {
                    let slot = Arc::new(CompletionSlot::new());
                    entry.insert(Arc::clone(&slot));
                    (slot, true)
                }
            }
        };
        if should_start {
            let runtime = self.clone();
            let producer_slot = Arc::clone(&slot);
            tokio::spawn(async move {
                let result = match runtime.start_internal(request).await {
                    Ok(handle) => handle.result().await,
                    Err(error) => Err(error),
                }
                .map_err(SharedAgentError::from_error);
                producer_slot.complete(result);
            });
        }
        slot.wait().await.map_err(SharedAgentError::into_error)
    }

    pub async fn start(&self, request: AgentRunRequest) -> Result<AgentRunHandle, AgentError> {
        if request.idempotency_key.is_some() {
            return Err(AgentError::InvalidConfiguration(
                "streaming start does not replay idempotent event streams; use run() for root idempotency"
                    .to_string(),
            ));
        }
        self.start_internal(request).await
    }

    async fn start_internal(&self, request: AgentRunRequest) -> Result<AgentRunHandle, AgentError> {
        validate_root_request(&request)?;
        let agent = self.inner.snapshot.agent(&request.entry_agent)?;
        let model = self.inner.snapshot.resolve_model(&agent, None)?;
        let effective_limits =
            EffectiveLimits::from_request(&self.inner.limits, request.limits.as_ref());
        effective_limits.runtime.validate()?;
        let budget = Arc::new(BudgetLedger::new(effective_limits));
        budget.reserve_run()?;

        let run_id = RunId::new();
        let root_run_id = run_id.clone();
        let session_id = request
            .session
            .session_id
            .clone()
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let cancellation = CancellationToken::new();
        let (event_tx, event_rx) = mpsc::channel(EVENT_CHANNEL_CAPACITY);
        let events = EventBus::new(
            event_tx,
            request.event_visibility,
            request.include_thinking_events,
        );
        let (command_tx, command_rx) = mpsc::channel(COMMAND_CHANNEL_CAPACITY);
        let metadata =
            metadata_with_lineage(&request.metadata, &root_run_id, None, None, &agent.id, 0);
        let deadline = run_deadline(
            Instant::now(),
            budget.limits().runtime.root_timeout,
            budget.limits().runtime.run_timeout,
            agent.limits.timeout_millis,
            None,
        );
        let mut session = request.session.clone();
        session.session_id = Some(session_id.clone());

        let context = RunContext {
            run_id: run_id.clone(),
            root_run_id: root_run_id.clone(),
            parent_run_id: None,
            agent_call_id: None,
            agent: Arc::clone(&agent),
            model,
            session_id: session_id.clone(),
            parent_session_id: None,
            session,
            runtime_context: request.runtime_context.clone(),
            depth: 0,
            ancestry: vec![agent.id.clone()],
            deadline,
            max_iterations_override: None,
            result_contract: None,
            cancellation: cancellation.clone(),
            budget,
            snapshot: Arc::clone(&self.inner.snapshot),
            events,
            child_count: Arc::new(AtomicUsize::new(0)),
            active_children: Arc::new(AtomicUsize::new(0)),
            usage: Arc::new(std::sync::Mutex::new(RunUsage::default())),
            metadata,
        };

        let lease = self
            .inner
            .supervisor
            .register(context.clone(), command_tx)
            .await?;
        if let Err(error) = self.inner.create_run_record(&context).await {
            self.inner.supervisor.unregister(&run_id).await;
            drop(lease);
            return Err(error);
        }

        let (result_tx, result_rx) = oneshot::channel();
        let inner = Arc::clone(&self.inner);
        tokio::spawn(async move {
            let result = inner
                .execute_run(context, request.input, command_rx, lease)
                .await;
            let _ = result_tx.send(result);
        });

        Ok(AgentRunHandle {
            run_id: run_id.clone(),
            events: event_rx,
            commands: AgentRunCommandSender {
                runtime: self.clone(),
                run_id,
            },
            result: result_rx,
        })
    }

    pub async fn cancel(&self, run_id: &RunId) -> Result<(), AgentError> {
        self.inner.supervisor.cancel(run_id).await
    }

    pub async fn send_message(
        &self,
        run_id: &RunId,
        messages: Vec<String>,
    ) -> Result<(), AgentError> {
        self.inner.supervisor.send_message(run_id, messages).await
    }

    pub async fn send_command(
        &self,
        run_id: &RunId,
        command: AgentRunCommand,
    ) -> Result<(), AgentError> {
        match command {
            AgentRunCommand::EnqueueUserMessages(messages) => {
                self.send_message(run_id, messages).await
            }
            AgentRunCommand::Cancel => self.cancel(run_id).await,
        }
    }

    pub async fn get_run(&self, run_id: &RunId) -> Option<RunRecord> {
        self.inner.supervisor.run_store.get(run_id).await
    }

    pub async fn list_run_tree(&self, root_run_id: &RunId) -> Vec<RunRecord> {
        self.inner.supervisor.run_store.list_root(root_run_id).await
    }

    pub async fn call_agent(
        &self,
        caller_run_id: &RunId,
        call_id: AgentCallId,
        request: AgentCallRequest,
    ) -> Result<AgentCallResult, AgentError> {
        RuntimeInner::call_agent(Arc::clone(&self.inner), caller_run_id, call_id, request).await
    }
}

pub struct AgentRunHandle {
    pub run_id: RunId,
    pub events: mpsc::Receiver<super::types::AgentEventEnvelope>,
    pub commands: AgentRunCommandSender,
    result: oneshot::Receiver<AgentRunResult>,
}

impl AgentRunHandle {
    pub async fn result(self) -> Result<AgentRunResult, AgentError> {
        self.result
            .await
            .map_err(|_| AgentError::Internal("Agent run task stopped unexpectedly".to_string()))
    }
}

#[derive(Clone)]
pub struct AgentRunCommandSender {
    runtime: AgentRuntime,
    run_id: RunId,
}

impl AgentRunCommandSender {
    pub async fn enqueue(&self, messages: Vec<String>) -> Result<(), AgentError> {
        self.runtime.send_message(&self.run_id, messages).await
    }

    pub async fn cancel(&self) -> Result<(), AgentError> {
        self.runtime.cancel(&self.run_id).await
    }
}

struct RuntimeInner {
    snapshot: Arc<RuntimeSnapshot>,
    supervisor: RunSupervisor,
    limits: RuntimeLimits,
    model_executor: Arc<dyn ModelExecutor>,
    authorizer: Arc<dyn AgentCallAuthorizer>,
    call_slots: Mutex<HashMap<CallKey, Arc<CompletionSlot<AgentCallResult>>>>,
    root_slots:
        Mutex<HashMap<RootCallKey, Arc<CompletionSlot<Result<AgentRunResult, SharedAgentError>>>>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct CallKey {
    root_run_id: RunId,
    caller_run_id: RunId,
    call_id: AgentCallId,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct RootCallKey {
    partition_key: String,
    idempotency_key: String,
}

struct CompletionSlot<T> {
    value: std::sync::OnceLock<T>,
    notify: Notify,
}

impl<T> CompletionSlot<T>
where
    T: Clone,
{
    fn new() -> Self {
        Self {
            value: std::sync::OnceLock::new(),
            notify: Notify::new(),
        }
    }

    fn is_complete(&self) -> bool {
        self.value.get().is_some()
    }

    fn complete(&self, value: T) {
        let _ = self.value.set(value);
        self.notify.notify_waiters();
    }

    async fn wait(&self) -> T {
        loop {
            let notified = self.notify.notified();
            if let Some(value) = self.value.get() {
                return value.clone();
            }
            notified.await;
        }
    }
}

#[derive(Clone)]
enum SharedAgentError {
    InvalidConfiguration(String),
    AgentNotFound(String),
    AgentCallDenied { caller: String, target: String },
    AgentCallCycle(String),
    MaxDepthExceeded(usize),
    BudgetExceeded(String),
    SessionBusy(String),
    TimedOut,
    Cancelled,
    ContextError(String),
    ToolError(String),
    RequiredTerminalTool(String),
    StorageError(String),
    Internal(String),
    MaxIterationsExceeded(u32),
}

impl SharedAgentError {
    fn from_error(error: AgentError) -> Self {
        match error {
            AgentError::InvalidConfiguration(value) => Self::InvalidConfiguration(value),
            AgentError::AgentNotFound(value) => Self::AgentNotFound(value),
            AgentError::AgentCallDenied { caller, target } => {
                Self::AgentCallDenied { caller, target }
            }
            AgentError::AgentCallCycle(value) => Self::AgentCallCycle(value),
            AgentError::MaxDepthExceeded(value) => Self::MaxDepthExceeded(value),
            AgentError::BudgetExceeded(value) => Self::BudgetExceeded(value),
            AgentError::SessionBusy(value) => Self::SessionBusy(value),
            AgentError::TimedOut => Self::TimedOut,
            AgentError::Cancelled => Self::Cancelled,
            AgentError::AiError(value) => Self::Internal(value.to_string()),
            AgentError::ContextError(value) => Self::ContextError(value),
            AgentError::MessageResolution(value) => Self::ContextError(value),
            AgentError::ModelResponseObservation(value) => Self::ContextError(value),
            AgentError::ToolError(value) => Self::ToolError(value),
            AgentError::RequiredTerminalTool(value) => Self::RequiredTerminalTool(value),
            AgentError::StorageError(value) => Self::StorageError(value),
            AgentError::Internal(value) => Self::Internal(value),
            AgentError::MaxIterationsExceeded(value) => Self::MaxIterationsExceeded(value),
        }
    }

    fn into_error(self) -> AgentError {
        match self {
            Self::InvalidConfiguration(value) => AgentError::InvalidConfiguration(value),
            Self::AgentNotFound(value) => AgentError::AgentNotFound(value),
            Self::AgentCallDenied { caller, target } => {
                AgentError::AgentCallDenied { caller, target }
            }
            Self::AgentCallCycle(value) => AgentError::AgentCallCycle(value),
            Self::MaxDepthExceeded(value) => AgentError::MaxDepthExceeded(value),
            Self::BudgetExceeded(value) => AgentError::BudgetExceeded(value),
            Self::SessionBusy(value) => AgentError::SessionBusy(value),
            Self::TimedOut => AgentError::TimedOut,
            Self::Cancelled => AgentError::Cancelled,
            Self::ContextError(value) => AgentError::ContextError(value),
            Self::ToolError(value) => AgentError::ToolError(value),
            Self::RequiredTerminalTool(value) => AgentError::RequiredTerminalTool(value),
            Self::StorageError(value) => AgentError::StorageError(value),
            Self::Internal(value) => AgentError::Internal(value),
            Self::MaxIterationsExceeded(value) => AgentError::MaxIterationsExceeded(value),
        }
    }
}

impl RuntimeInner {
    async fn create_run_record(&self, context: &RunContext) -> Result<(), AgentError> {
        let mut metadata = context.metadata.clone();
        if let Some(parent_session_id) = &context.parent_session_id {
            metadata.insert(
                "parent_session_id".to_string(),
                serde_json::json!(parent_session_id),
            );
        }
        self.supervisor
            .run_store
            .create(RunRecord {
                run_id: context.run_id.clone(),
                root_run_id: context.root_run_id.clone(),
                parent_run_id: context.parent_run_id.clone(),
                agent_call_id: context.agent_call_id.clone(),
                agent_id: context.agent.id.clone(),
                agent_definition_version: context.agent.version,
                session_id: context.session_id.clone(),
                status: RunStatus::Created,
                depth: context.depth,
                started_at: chrono::Utc::now().to_rfc3339(),
                finished_at: None,
                usage: RunUsage::default(),
                failure: None,
                metadata,
            })
            .await
    }

    async fn execute_run(
        self: Arc<Self>,
        context: RunContext,
        input: AgentInput,
        mut command_rx: mpsc::Receiver<AgentRunCommand>,
        lease: SessionLease,
    ) -> AgentRunResult {
        let started = Instant::now();
        let _ = self
            .supervisor
            .run_store
            .update_status(&context.run_id, RunStatus::Running)
            .await;
        emit(&context, AgentEvent::RunStarted);

        let run_loop =
            std::panic::AssertUnwindSafe(self.run_loop(&context, input, &mut command_rx))
                .catch_unwind();
        tokio::pin!(run_loop);
        let execution = tokio::select! {
            _ = context.cancellation.cancelled() => Err(AgentError::Cancelled),
            _ = tokio::time::sleep_until(tokio::time::Instant::from_std(context.deadline)) => {
                context.cancellation.cancel();
                Err(AgentError::TimedOut)
            }
            result = &mut run_loop => match result {
                Ok(result) => result,
                Err(_) => Err(AgentError::Internal("Agent run panicked".to_string())),
            },
        };

        let duration = started.elapsed().as_millis().min(u64::MAX as u128) as u64;
        let (outcome, output, usage, failure, status, terminal_event) = match execution {
            Ok((output, mut usage)) => {
                usage.duration_millis = duration;
                let output = match &context.result_contract {
                    Some(contract) => apply_result_contract(Some(output), contract),
                    None => Ok(Some(output)),
                };
                match output {
                    Ok(output) => (
                        RunOutcome::Completed,
                        output,
                        usage,
                        None,
                        RunStatus::Completed,
                        AgentEvent::RunCompleted,
                    ),
                    Err(failure) => (
                        RunOutcome::Failed(failure.clone()),
                        None,
                        usage,
                        Some(failure.clone()),
                        RunStatus::Failed,
                        AgentEvent::RunFailed { failure },
                    ),
                }
            }
            Err(error) => {
                let (outcome, status, event, failure) = error_outcome(&error);
                let mut usage = context.usage_snapshot();
                usage.duration_millis = duration;
                (outcome, None, usage, failure.clone(), status, event)
            }
        };

        if let Some(output) = output.as_ref() {
            if output.byte_len() > effective_result_limit(&context) {
                let failure = AgentFailure {
                    code: "max_result_bytes".to_string(),
                    message: "Agent result exceeds the configured size limit".to_string(),
                    retryable: false,
                };
                let result = AgentRunResult {
                    run_id: context.run_id.clone(),
                    root_run_id: context.root_run_id.clone(),
                    agent_id: context.agent.id.clone(),
                    session_id: context.session_id.clone(),
                    outcome: RunOutcome::BudgetExceeded,
                    output: None,
                    usage: usage.clone(),
                    artifacts: Vec::new(),
                    metadata: context.metadata.clone(),
                };
                let _ = self
                    .supervisor
                    .run_store
                    .finish(
                        &context.run_id,
                        RunStatus::BudgetExceeded,
                        usage,
                        Some(failure.clone()),
                    )
                    .await;
                emit(&context, AgentEvent::RunFailed { failure });
                self.supervisor.unregister(&context.run_id).await;
                if context.depth == 0 {
                    self.call_slots
                        .lock()
                        .await
                        .retain(|key, _| key.root_run_id != context.root_run_id);
                }
                drop(lease);
                return result;
            }
        }

        let _ = self
            .supervisor
            .run_store
            .finish(&context.run_id, status, usage.clone(), failure)
            .await;
        emit(&context, terminal_event);
        self.supervisor.unregister(&context.run_id).await;
        if context.depth == 0 {
            self.call_slots
                .lock()
                .await
                .retain(|key, _| key.root_run_id != context.root_run_id);
        }
        drop(lease);

        AgentRunResult {
            run_id: context.run_id.clone(),
            root_run_id: context.root_run_id.clone(),
            agent_id: context.agent.id.clone(),
            session_id: context.session_id.clone(),
            outcome,
            output,
            usage,
            artifacts: Vec::new(),
            metadata: context.metadata.clone(),
        }
    }

    async fn run_loop(
        &self,
        context: &RunContext,
        input: AgentInput,
        command_rx: &mut mpsc::Receiver<AgentRunCommand>,
    ) -> Result<(AgentOutput, RunUsage), AgentError> {
        persist_input(context, input).await?;
        let mut queued_messages = VecDeque::new();
        let mut usage = RunUsage::default();
        let max_iterations = context
            .agent
            .limits
            .max_iterations
            .unwrap_or(context.budget.limits().runtime.max_iterations_per_run)
            .min(context.budget.limits().runtime.max_iterations_per_run)
            .min(
                context
                    .max_iterations_override
                    .unwrap_or(context.budget.limits().runtime.max_iterations_per_run),
            );
        let (tool_registry, tool_definitions) = tool_registry_for(context)?;
        let system_prompt = system_prompt_for(context);

        for _ in 0..max_iterations {
            drain_commands(context, command_rx, &mut queued_messages)?;
            persist_queued_messages(context, &mut queued_messages).await?;

            let messages = combine_context(context, &system_prompt, &tool_definitions).await?;
            context.budget.reserve_model_call()?;
            usage.model_calls = usage.model_calls.saturating_add(1);
            context.record_usage(&usage);
            emit(context, AgentEvent::ModelStarted);

            let model_config = build_model_config(context, &messages, &tool_definitions);
            let permit = self
                .supervisor
                .model_semaphore
                .acquire()
                .await
                .map_err(|_| AgentError::Internal("model semaphore closed".to_string()))?;
            let stream = self
                .model_executor
                .stream(&context.model, model_config)
                .await?;
            let response = collect_model_stream(context, stream).await;
            drop(permit);
            let response = response?;

            usage.input_tokens = add_optional(usage.input_tokens, response.input_tokens);
            usage.output_tokens = add_optional(usage.output_tokens, response.output_tokens);
            usage.total_tokens = add_optional(usage.total_tokens, response.total_tokens);
            context.record_usage(&usage);
            if let Some(tokens) = response.total_tokens {
                context.budget.add_tokens(tokens)?;
            }
            emit(
                context,
                AgentEvent::ModelCompleted {
                    usage: response.usage(),
                },
            );

            persist_assistant_response(context, &response).await?;

            if response.tool_calls.is_empty() {
                drain_commands(context, command_rx, &mut queued_messages)?;
                if !queued_messages.is_empty() {
                    persist_queued_messages(context, &mut queued_messages).await?;
                    continue;
                }
                context.budget.add_output_bytes(response.content.len())?;
                return Ok((AgentOutput::Text(response.content), usage));
            }

            for _ in &response.tool_calls {
                context.budget.reserve_tool_call()?;
            }
            usage.tool_calls = usage
                .tool_calls
                .saturating_add(response.tool_calls.len() as u32);
            usage.agent_calls = usage.agent_calls.saturating_add(
                response
                    .tool_calls
                    .iter()
                    .filter(|call| call.function.name == AGENT_CALL_TOOL_NAME)
                    .count() as u32,
            );
            context.record_usage(&usage);

            let parallel = context
                .agent
                .model_overrides
                .parallel_tool_calls
                .unwrap_or(false);
            let results = self
                .execute_tools(
                    context,
                    Arc::clone(&tool_registry),
                    &response.tool_calls,
                    parallel,
                )
                .await;
            if serde_json::to_vec(&results)
                .map(|value| value.len())
                .unwrap_or(usize::MAX)
                > effective_result_limit(context)
            {
                return Err(AgentError::BudgetExceeded("max_result_bytes".to_string()));
            }
            if let Some(result) = results
                .iter()
                .find(|result| result.error_kind == Some(ToolErrorKind::Fatal))
            {
                return Err(AgentError::ToolError(format!(
                    "tool '{}' failed fatally: {}",
                    result.function_name,
                    result.error.as_deref().unwrap_or("unknown fatal error")
                )));
            }
            persist_tool_results(context, &results).await?;

            drain_commands(context, command_rx, &mut queued_messages)?;
            persist_queued_messages(context, &mut queued_messages).await?;
        }

        Err(AgentError::MaxIterationsExceeded(max_iterations))
    }

    async fn execute_tools(
        &self,
        context: &RunContext,
        registry: Arc<ToolRegistry>,
        calls: &[ToolCall],
        parallel: bool,
    ) -> Vec<ToolResult> {
        if parallel && calls.len() > 1 {
            join_all(
                calls
                    .iter()
                    .cloned()
                    .map(|call| self.execute_tool(context, Arc::clone(&registry), call)),
            )
            .await
        } else {
            let mut results = Vec::with_capacity(calls.len());
            for call in calls.iter().cloned() {
                results.push(
                    self.execute_tool(context, Arc::clone(&registry), call)
                        .await,
                );
            }
            results
        }
    }

    async fn execute_tool(
        &self,
        context: &RunContext,
        registry: Arc<ToolRegistry>,
        call: ToolCall,
    ) -> ToolResult {
        emit(
            context,
            AgentEvent::ToolStarted {
                tool_call_id: call.id.clone(),
                tool_name: call.function.name.clone(),
            },
        );

        let execution_class = registry
            .get(&call.function.name)
            .map(|registration| registration.execution_class)
            .unwrap_or(ToolExecutionClass::Standard);
        let tool_context = ToolCallContext {
            tool_call_id: call.id.clone(),
            run_id: context.run_id.to_string(),
            root_run_id: context.root_run_id.to_string(),
            agent_id: context.agent.id.to_string(),
            session_id: Some(context.session_id.clone()),
            runtime_context: context
                .runtime_context
                .as_ref()
                .and_then(|value| serde_json::to_value(value).ok()),
            metadata: serde_json::json!({ "memory_policy": context.agent.memory }),
            deadline: Some(context.deadline),
            cancellation: context.cancellation.clone(),
        };

        let result = if execution_class == ToolExecutionClass::Delegating {
            registry.execute(&call, tool_context).await
        } else {
            match self.supervisor.tool_semaphore.acquire().await {
                Ok(_permit) => registry.execute(&call, tool_context).await,
                Err(_) => ToolResult {
                    tool_call_id: call.id.clone(),
                    function_name: call.function.name.clone(),
                    result: None,
                    error: Some("tool semaphore closed".to_string()),
                    error_kind: Some(ToolErrorKind::Fatal),
                },
            }
        };

        emit(
            context,
            AgentEvent::ToolCompleted {
                tool_call_id: call.id,
                tool_name: call.function.name,
                error: result.error.clone(),
            },
        );
        result
    }

    async fn call_agent(
        self: Arc<Self>,
        caller_run_id: &RunId,
        call_id: AgentCallId,
        request: AgentCallRequest,
    ) -> Result<AgentCallResult, AgentError> {
        let caller = self
            .supervisor
            .active(caller_run_id)
            .await
            .ok_or_else(|| {
                AgentError::InvalidConfiguration(format!(
                    "caller run '{caller_run_id}' is not active"
                ))
            })?
            .context;
        let key = CallKey {
            root_run_id: caller.root_run_id.clone(),
            caller_run_id: caller.run_id.clone(),
            call_id: call_id.clone(),
        };
        let (slot, should_start) = {
            let mut slots = self.call_slots.lock().await;
            match slots.entry(key) {
                std::collections::hash_map::Entry::Occupied(entry) => {
                    (Arc::clone(entry.get()), false)
                }
                std::collections::hash_map::Entry::Vacant(entry) => {
                    let slot = Arc::new(CompletionSlot::new());
                    entry.insert(Arc::clone(&slot));
                    (slot, true)
                }
            }
        };
        if should_start {
            let producer_slot = Arc::clone(&slot);
            tokio::spawn(async move {
                let result = self.execute_agent_call(caller, call_id, request).await;
                producer_slot.complete(result);
            });
        }
        Ok(slot.wait().await)
    }

    async fn execute_agent_call(
        self: Arc<Self>,
        caller: RunContext,
        call_id: AgentCallId,
        request: AgentCallRequest,
    ) -> AgentCallResult {
        emit(
            &caller,
            AgentEvent::AgentCallStarted {
                call_id: call_id.clone(),
                target: request.target.clone(),
            },
        );
        let execution = {
            let execution = self.try_execute_agent_call(&caller, &call_id, &request);
            tokio::pin!(execution);
            tokio::select! {
                _ = caller.cancellation.cancelled() => Err(AgentError::Cancelled),
                _ = tokio::time::sleep_until(tokio::time::Instant::from_std(caller.deadline)) => {
                    Err(AgentError::TimedOut)
                }
                result = &mut execution => result,
            }
        };
        let result = match execution {
            Ok(result) => result,
            Err(error) => failed_call_result(call_id.clone(), request.target.clone(), &error),
        };
        emit(
            &caller,
            AgentEvent::AgentCallCompleted {
                call_id,
                target: result.target.clone(),
                outcome: result.outcome.kind(),
            },
        );
        result
    }

    async fn try_execute_agent_call(
        self: &Arc<Self>,
        caller: &RunContext,
        call_id: &AgentCallId,
        request: &AgentCallRequest,
    ) -> Result<AgentCallResult, AgentError> {
        if caller.cancellation.is_cancelled() {
            return Err(AgentError::Cancelled);
        }
        if Instant::now() >= caller.deadline {
            return Err(AgentError::TimedOut);
        }
        request.target.validate()?;
        if request.task.trim().is_empty() {
            return Err(AgentError::InvalidConfiguration(
                "Agent call task is required".to_string(),
            ));
        }
        if request.max_iterations == Some(0) {
            return Err(AgentError::InvalidConfiguration(
                "Agent call max_iterations must be greater than zero".to_string(),
            ));
        }
        if request.timeout.is_some_and(|timeout| timeout.is_zero()) {
            return Err(AgentError::InvalidConfiguration(
                "Agent call timeout must be greater than zero".to_string(),
            ));
        }
        let context_bytes = request
            .context
            .as_ref()
            .and_then(|value| serde_json::to_vec(value).ok())
            .map(|value| value.len())
            .unwrap_or(0);
        if context_bytes > caller.budget.limits().runtime.max_context_transfer_bytes {
            return Err(AgentError::BudgetExceeded(
                "max_context_transfer_bytes".to_string(),
            ));
        }

        let target = caller.snapshot.agent(&request.target)?;
        if !caller.agent.callable_agents.allows(&target.id)
            || !caller.snapshot.policy.callable_agents.allows(&target.id)
        {
            return Err(AgentError::AgentCallDenied {
                caller: caller.agent.id.to_string(),
                target: target.id.to_string(),
            });
        }

        if !caller.snapshot.policy.allow_recursive_calls
            && caller.ancestry.iter().any(|agent| agent == &target.id)
        {
            return Err(AgentError::AgentCallCycle(format!(
                "{} -> {}",
                caller
                    .ancestry
                    .iter()
                    .map(ToString::to_string)
                    .collect::<Vec<_>>()
                    .join(" -> "),
                target.id
            )));
        }

        let depth = caller.depth + 1;
        if depth > caller.budget.limits().runtime.max_depth {
            return Err(AgentError::MaxDepthExceeded(
                caller.budget.limits().runtime.max_depth,
            ));
        }

        match self
            .authorizer
            .authorize(&caller.view(), &target, request)
            .await?
        {
            AuthorizationDecision::Allow => {}
            AuthorizationDecision::Deny(reason) => {
                return Err(AgentError::AgentCallDenied {
                    caller: caller.agent.id.to_string(),
                    target: format!("{} ({reason})", target.id),
                })
            }
        }

        caller.reserve_child()?;
        caller.budget.reserve_agent_call()?;
        caller.budget.reserve_run()?;

        let model = caller
            .snapshot
            .resolve_model(&target, Some(&caller.model.id))?;
        let child_run_id = RunId::new();
        let child_session_id = uuid::Uuid::new_v4().to_string();
        let mut child_session = caller.session.clone();
        child_session.session_id = Some(child_session_id.clone());
        let child_input = build_child_input(caller, &target, request).await?;
        let cancellation = caller.cancellation.child_token();
        let deadline = run_deadline(
            Instant::now(),
            caller.deadline.saturating_duration_since(Instant::now()),
            caller.budget.limits().runtime.run_timeout,
            target.limits.timeout_millis,
            request.timeout,
        )
        .min(caller.deadline);
        let mut ancestry = caller.ancestry.clone();
        ancestry.push(target.id.clone());
        let metadata = metadata_with_lineage(
            &request.metadata,
            &caller.root_run_id,
            Some(&caller.run_id),
            Some(call_id),
            &target.id,
            depth,
        );
        let child_context = RunContext {
            run_id: child_run_id.clone(),
            root_run_id: caller.root_run_id.clone(),
            parent_run_id: Some(caller.run_id.clone()),
            agent_call_id: Some(call_id.clone()),
            agent: Arc::clone(&target),
            model,
            session_id: child_session_id,
            parent_session_id: Some(caller.session_id.clone()),
            session: child_session,
            runtime_context: caller.runtime_context.clone(),
            depth,
            ancestry,
            deadline,
            max_iterations_override: request.max_iterations,
            result_contract: Some(request.result_contract.clone()),
            cancellation,
            budget: Arc::clone(&caller.budget),
            snapshot: Arc::clone(&caller.snapshot),
            events: caller.events.clone(),
            child_count: Arc::new(AtomicUsize::new(0)),
            active_children: Arc::new(AtomicUsize::new(0)),
            usage: Arc::new(std::sync::Mutex::new(RunUsage::default())),
            metadata,
        };

        let (command_tx, command_rx) = mpsc::channel(COMMAND_CHANNEL_CAPACITY);
        let lease = self
            .supervisor
            .register(child_context.clone(), command_tx)
            .await?;
        if let Err(error) = self.create_run_record(&child_context).await {
            self.supervisor.unregister(&child_run_id).await;
            drop(lease);
            return Err(error);
        }

        let active_children = caller.active_children.fetch_add(1, Ordering::SeqCst) + 1;
        if active_children == 1 {
            let _ = self
                .supervisor
                .run_store
                .update_status(&caller.run_id, RunStatus::WaitingForChild)
                .await;
        }

        let runtime = Arc::clone(self);
        let child_task = tokio::spawn(async move {
            runtime
                .execute_run(
                    child_context,
                    AgentInput::Text(child_input),
                    command_rx,
                    lease,
                )
                .await
        });
        let result = child_task.await;

        if caller.active_children.fetch_sub(1, Ordering::SeqCst) == 1 {
            let _ = self
                .supervisor
                .run_store
                .update_status(&caller.run_id, RunStatus::Running)
                .await;
        }
        let result = result.map_err(|error| {
            AgentError::Internal(format!(
                "child Agent run task stopped unexpectedly: {error}"
            ))
        })?;

        Ok(call_result_from_run(
            call_id.clone(),
            target.id.clone(),
            result,
        ))
    }
}

fn validate_root_request(request: &AgentRunRequest) -> Result<(), AgentError> {
    request.entry_agent.validate()?;
    match &request.input {
        AgentInput::Text(value) if value.trim().is_empty() => {
            return Err(AgentError::InvalidConfiguration(
                "Agent input is required".to_string(),
            ))
        }
        AgentInput::Messages(messages) if messages.is_empty() => {
            return Err(AgentError::InvalidConfiguration(
                "Agent input messages are required".to_string(),
            ))
        }
        AgentInput::Text(_) | AgentInput::Messages(_) => {}
    }
    if request.session.context_window == 0 {
        return Err(AgentError::InvalidConfiguration(
            "context_window must be greater than zero".to_string(),
        ));
    }
    if request
        .session
        .session_id
        .as_ref()
        .is_some_and(|session_id| session_id.trim().is_empty() || session_id.len() > 256)
    {
        return Err(AgentError::InvalidConfiguration(
            "session_id must contain 1-256 characters".to_string(),
        ));
    }
    if request
        .session
        .threshold_percentage
        .is_some_and(|value| !value.is_finite() || value <= 0.0 || value > 1.0)
    {
        return Err(AgentError::InvalidConfiguration(
            "threshold_percentage must be greater than 0 and at most 1".to_string(),
        ));
    }
    let uses_database = request.session.context_load_type == ContextLoadType::Database
        || request.session.storage_type == StorageType::Database;
    if uses_database {
        if request.session.database_config.is_none() {
            return Err(AgentError::InvalidConfiguration(
                "database_config is required for database storage or context".to_string(),
            ));
        }
        let runtime_context = request.runtime_context.as_ref().ok_or_else(|| {
            AgentError::InvalidConfiguration(
                "runtime_context is required for database storage or context".to_string(),
            )
        })?;
        runtime_context
            .validate()
            .map_err(AgentError::InvalidConfiguration)?;
    } else if let Some(runtime_context) = &request.runtime_context {
        runtime_context
            .validate()
            .map_err(AgentError::InvalidConfiguration)?;
    }
    if request
        .idempotency_key
        .as_ref()
        .is_some_and(|key| key.is_empty() || key.len() > 256)
    {
        return Err(AgentError::InvalidConfiguration(
            "idempotency_key must contain 1-256 characters".to_string(),
        ));
    }
    Ok(())
}

fn run_deadline(
    now: Instant,
    root_timeout: Duration,
    run_timeout: Duration,
    agent_timeout_millis: Option<u64>,
    call_timeout: Option<Duration>,
) -> Instant {
    let mut timeout = root_timeout.min(run_timeout);
    if let Some(value) = agent_timeout_millis {
        timeout = timeout.min(Duration::from_millis(value));
    }
    if let Some(value) = call_timeout {
        timeout = timeout.min(value);
    }
    now + timeout
}

fn effective_result_limit(context: &RunContext) -> usize {
    context
        .agent
        .limits
        .max_result_bytes
        .unwrap_or(context.budget.limits().runtime.max_result_bytes)
        .min(context.budget.limits().runtime.max_result_bytes)
}

fn emit(context: &RunContext, event: AgentEvent) {
    context.events.emit(
        &context.root_run_id,
        &context.run_id,
        context.parent_run_id.as_ref(),
        &context.agent.id,
        context.depth,
        event,
    );
}

fn error_outcome(error: &AgentError) -> (RunOutcome, RunStatus, AgentEvent, Option<AgentFailure>) {
    match error {
        AgentError::Cancelled => (
            RunOutcome::Cancelled,
            RunStatus::Cancelled,
            AgentEvent::RunCancelled,
            None,
        ),
        AgentError::TimedOut => (
            RunOutcome::TimedOut,
            RunStatus::TimedOut,
            AgentEvent::RunFailed {
                failure: failure_from_error(error),
            },
            Some(failure_from_error(error)),
        ),
        AgentError::BudgetExceeded(_) | AgentError::MaxIterationsExceeded(_) => (
            RunOutcome::BudgetExceeded,
            RunStatus::BudgetExceeded,
            AgentEvent::RunFailed {
                failure: failure_from_error(error),
            },
            Some(failure_from_error(error)),
        ),
        _ => {
            let failure = failure_from_error(error);
            (
                RunOutcome::Failed(failure.clone()),
                RunStatus::Failed,
                AgentEvent::RunFailed {
                    failure: failure.clone(),
                },
                Some(failure),
            )
        }
    }
}

fn failure_from_error(error: &AgentError) -> AgentFailure {
    let code = match error {
        AgentError::InvalidConfiguration(_) => "invalid_configuration",
        AgentError::AgentNotFound(_) => "agent_not_found",
        AgentError::AgentCallDenied { .. } => "agent_call_denied",
        AgentError::AgentCallCycle(_) => "agent_call_cycle",
        AgentError::MaxDepthExceeded(_) => "max_depth_exceeded",
        AgentError::BudgetExceeded(_) | AgentError::MaxIterationsExceeded(_) => "budget_exceeded",
        AgentError::SessionBusy(_) => "session_busy",
        AgentError::TimedOut => "timed_out",
        AgentError::Cancelled => "cancelled",
        AgentError::AiError(_) => "model_error",
        AgentError::ContextError(_) => "context_error",
        AgentError::MessageResolution(_) => "message_resolution_error",
        AgentError::ModelResponseObservation(_) => "model_response_observation_error",
        AgentError::ToolError(_) => "tool_error",
        AgentError::RequiredTerminalTool(_) => "required_terminal_tool_error",
        AgentError::StorageError(_) => "storage_error",
        AgentError::Internal(_) => "internal_error",
    };
    AgentFailure {
        code: code.to_string(),
        message: error.to_string(),
        retryable: matches!(
            error,
            AgentError::TimedOut | AgentError::AiError(_) | AgentError::SessionBusy(_)
        ),
    }
}

fn failed_call_result(
    call_id: AgentCallId,
    target: AgentId,
    error: &AgentError,
) -> AgentCallResult {
    AgentCallResult {
        schema_version: 1,
        call_id,
        target,
        run_id: None,
        outcome: RunOutcome::Failed(failure_from_error(error)),
        output: None,
        usage: RunUsage::default(),
        artifacts: Vec::new(),
    }
}

fn call_result_from_run(
    call_id: AgentCallId,
    target: AgentId,
    result: AgentRunResult,
) -> AgentCallResult {
    AgentCallResult {
        schema_version: 1,
        call_id,
        target,
        run_id: Some(result.run_id),
        outcome: result.outcome,
        output: result.output,
        usage: result.usage,
        artifacts: result.artifacts,
    }
}

fn apply_result_contract(
    output: Option<AgentOutput>,
    contract: &ResultContract,
) -> Result<Option<AgentOutput>, AgentFailure> {
    let Some(output) = output else {
        return Ok(None);
    };
    match contract {
        ResultContract::Text => match output {
            AgentOutput::Text(value) => Ok(Some(AgentOutput::Text(value))),
            AgentOutput::Json(value) => Ok(Some(AgentOutput::Text(value.to_string()))),
        },
        ResultContract::Auto => match output {
            AgentOutput::Text(value) => match serde_json::from_str(&value) {
                Ok(json) => Ok(Some(AgentOutput::Json(json))),
                Err(_) => Ok(Some(AgentOutput::Text(value))),
            },
            AgentOutput::Json(value) => Ok(Some(AgentOutput::Json(value))),
        },
        ResultContract::Json { schema } => {
            let value = match output {
                AgentOutput::Json(value) => value,
                AgentOutput::Text(value) => serde_json::from_str(&value).map_err(|error| {
                    invalid_output_failure(format!("invalid JSON Agent output: {error}"))
                })?,
            };
            if let Some(schema) = schema {
                if !schema.is_object() {
                    return Err(invalid_output_failure(
                        "Agent result JSON schema must be an object",
                    ));
                }
                validate_basic_json_schema(&value, schema).map_err(invalid_output_failure)?;
            }
            Ok(Some(AgentOutput::Json(value)))
        }
    }
}

fn invalid_output_failure(message: impl Into<String>) -> AgentFailure {
    AgentFailure {
        code: "invalid_agent_output".to_string(),
        message: message.into(),
        retryable: true,
    }
}

fn validate_basic_json_schema(
    value: &serde_json::Value,
    schema: &serde_json::Value,
) -> Result<(), String> {
    if let Some(expected_type) = schema.get("type").and_then(|value| value.as_str()) {
        let valid = match expected_type {
            "object" => value.is_object(),
            "array" => value.is_array(),
            "string" => value.is_string(),
            "number" => value.is_number(),
            "integer" => value.as_i64().is_some() || value.as_u64().is_some(),
            "boolean" => value.is_boolean(),
            "null" => value.is_null(),
            _ => true,
        };
        if !valid {
            return Err(format!("Agent output must be JSON type '{expected_type}'"));
        }
    }
    if let (Some(object), Some(required)) = (
        value.as_object(),
        schema.get("required").and_then(|value| value.as_array()),
    ) {
        for key in required.iter().filter_map(|value| value.as_str()) {
            if !object.contains_key(key) {
                return Err(format!("Agent output is missing required field '{key}'"));
            }
        }
    }
    Ok(())
}

fn system_prompt_for(context: &RunContext) -> String {
    let skill_policy = context.snapshot.skill_policy_for(&context.agent);
    let skills = context.snapshot.skills.format_for_prompt(&skill_policy);
    let memory = match context.agent.memory {
        MemoryPolicy::Disabled => "",
        MemoryPolicy::ReadOnlyShared => {
            "\nLong-term memory is read-only. Use memory.recall only when relevant."
        }
        MemoryPolicy::ReadWriteShared | MemoryPolicy::PrivateAgent => {
            "\nLong-term memory is available. Recall relevant facts before answering and store only durable, non-sensitive information."
        }
    };
    format!("{}{}{}", context.agent.system_prompt, skills, memory)
}

fn tool_registry_for(context: &RunContext) -> Result<(Arc<ToolRegistry>, Vec<Tool>), AgentError> {
    let names = context.snapshot.tool_names_for(&context.agent);
    let mut registry = context
        .snapshot
        .tools
        .subset(names.iter().map(String::as_str))
        .map_err(|error| AgentError::ToolError(error.to_string()))?;

    let reachable = context.snapshot.reachable_agents(&context.agent);
    if !reachable.is_empty() {
        let mut registration = context
            .snapshot
            .tools
            .get(AGENT_CALL_TOOL_NAME)
            .cloned()
            .ok_or_else(|| AgentError::Internal("Agent call tool is not registered".to_string()))?;
        registration.definition = agent_call_tool_definition(&reachable);
        registry
            .register(registration)
            .map_err(|error| AgentError::ToolError(error.to_string()))?;
    }

    let definitions = registry.definitions();
    Ok((Arc::new(registry), definitions))
}

fn agent_call_tool_definition(reachable: &[Arc<AgentDefinition>]) -> Tool {
    let names = reachable
        .iter()
        .map(|agent| serde_json::Value::String(agent.id.to_string()))
        .collect::<Vec<_>>();
    let descriptions = reachable
        .iter()
        .map(|agent| format!("- {}: {}", agent.id, agent.description))
        .collect::<Vec<_>>()
        .join("\n");
    Tool {
        tool_type: "function".to_string(),
        function: FunctionDefinition {
            name: AGENT_CALL_TOOL_NAME.to_string(),
            description: format!(
                "Delegate one focused task to another Agent and wait for its structured result.\n{descriptions}"
            ),
            parameters: Some(serde_json::json!({
                "type": "object",
                "properties": {
                    "agent": { "type": "string", "enum": names },
                    "task": { "type": "string" },
                    "context": { "type": "object" }
                },
                "required": ["agent", "task"],
                "additionalProperties": false
            })),
        },
    }
}

fn build_model_config(
    context: &RunContext,
    messages: &[Message],
    tools: &[Tool],
) -> serde_json::Value {
    use otherone_ai::types::ProviderType;

    let overrides = &context.agent.model_overrides;
    let mut config = serde_json::json!({
        "model": context.model.model,
        "messages": messages,
        "stream": true,
    });
    let provider = &context.model.provider;
    let context_length = overrides.context_length.or(context.model.context_length);
    let max_tokens = overrides.max_tokens.or(context.model.max_tokens);
    if let Some(value) = context_length.filter(|_| {
        matches!(
            provider,
            ProviderType::OpenAI | ProviderType::OpenRouter | ProviderType::Local
        )
    }) {
        config["contextLength"] = serde_json::json!(value);
    }
    let effective_max_tokens = if matches!(provider, ProviderType::Fetch) {
        max_tokens.or(context_length)
    } else {
        max_tokens
    };
    if let Some(value) = effective_max_tokens {
        let key = match provider {
            ProviderType::Anthropic | ProviderType::Fetch => "max_tokens",
            ProviderType::OpenAI | ProviderType::OpenRouter | ProviderType::Local => "maxTokens",
        };
        config[key] = serde_json::json!(value);
    }
    if let Some(value) = overrides.temperature.or(context.model.temperature) {
        config["temperature"] = serde_json::json!(value);
    }
    if let Some(value) = overrides.top_p.or(context.model.top_p) {
        let key = if matches!(provider, ProviderType::Fetch) {
            "top_p"
        } else {
            "topP"
        };
        config[key] = serde_json::json!(value);
    }
    if !tools.is_empty() {
        config["tools"] = serde_json::json!(tools);
    }
    if let Some(value) = &overrides.tool_choice {
        match provider {
            ProviderType::Fetch => config["tool_choice"] = serde_json::json!(value),
            ProviderType::OpenAI | ProviderType::OpenRouter | ProviderType::Local => {
                config["toolChoice"] = serde_json::json!(value)
            }
            ProviderType::Anthropic => {}
        }
    }
    if let Some(value) = overrides.parallel_tool_calls.filter(|_| {
        matches!(
            provider,
            ProviderType::OpenAI | ProviderType::OpenRouter | ProviderType::Local
        )
    }) {
        config["parallelToolCalls"] = serde_json::json!(value);
    }
    if let Some(serde_json::Value::Object(values)) =
        merge_other(context.model.other.as_ref(), overrides.other.as_ref())
    {
        for (key, value) in values {
            config[key] = value;
        }
    }
    config
}

async fn combine_context(
    context: &RunContext,
    system_prompt: &str,
    tools: &[Tool],
) -> Result<Vec<Message>, AgentError> {
    let load_type = match context.session.context_load_type {
        ContextLoadType::LocalFile => otherone_context::types::ContextLoadType::LocalFile,
        ContextLoadType::Database => otherone_context::types::ContextLoadType::Database,
    };
    otherone_context::combine_context(&otherone_context::types::CombineContextOptions {
        session_id: context.session_id.clone(),
        load_type,
        provider: context.model.provider.clone(),
        context_window: context.session.context_window,
        threshold_percentage: context.session.threshold_percentage,
        ai: merge_other(
            context.model.other.as_ref(),
            context.agent.model_overrides.other.as_ref(),
        ),
        system_prompt: (!system_prompt.is_empty()).then(|| system_prompt.to_string()),
        tools: (!tools.is_empty()).then(|| tools.to_vec()),
        database_config: context.session.database_config.clone(),
        runtime_context: context.runtime_context.clone(),
            compact_executor: None,
    })
    .await
    .map_err(|error| AgentError::ContextError(error.to_string()))
}

struct ModelTurn {
    content: String,
    role: String,
    tool_calls: Vec<ToolCall>,
    input_tokens: Option<u64>,
    output_tokens: Option<u64>,
    total_tokens: Option<u64>,
}

impl ModelTurn {
    fn usage(&self) -> RunUsage {
        RunUsage {
            input_tokens: self.input_tokens,
            output_tokens: self.output_tokens,
            total_tokens: self.total_tokens,
            model_calls: 1,
            ..Default::default()
        }
    }
}

async fn collect_model_stream(
    context: &RunContext,
    mut stream: ChatStream,
) -> Result<ModelTurn, AgentError> {
    let mut content = String::new();
    let mut role = "assistant".to_string();
    let mut tool_calls = Vec::new();
    let mut input_tokens = None;
    let mut output_tokens = None;
    let mut total_tokens = None;
    let output_limit = effective_result_limit(context);
    let mut tool_payload_bytes = 0usize;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        if let Some(choice) = chunk.choices.first() {
            if let Some(delta) = &choice.delta {
                if let Some(value) = &delta.role {
                    role = value.clone();
                }
                if let Some(value) = &delta.content {
                    if content
                        .len()
                        .saturating_add(tool_payload_bytes)
                        .saturating_add(value.len())
                        > output_limit
                    {
                        return Err(AgentError::BudgetExceeded("max_result_bytes".to_string()));
                    }
                    content.push_str(value);
                    emit(
                        context,
                        AgentEvent::ModelDelta {
                            content: value.clone(),
                        },
                    );
                }
                if let Some(value) = delta_thinking(delta) {
                    emit(
                        context,
                        AgentEvent::ThinkingDelta {
                            content: value.to_string(),
                        },
                    );
                }
                if let Some(calls) = &delta.tool_calls {
                    for call in calls {
                        tool_payload_bytes = tool_payload_bytes
                            .saturating_add(call.id.len())
                            .saturating_add(call.function.name.len())
                            .saturating_add(call.function.arguments.len());
                        if content.len().saturating_add(tool_payload_bytes) > output_limit {
                            return Err(AgentError::BudgetExceeded("max_result_bytes".to_string()));
                        }
                        merge_tool_call_delta(&mut tool_calls, call);
                    }
                }
            } else if let Some(message) = &choice.message {
                if let Some(value) = &message.role {
                    role = value.clone();
                }
                if let Some(value) = &message.content {
                    if content
                        .len()
                        .saturating_add(tool_payload_bytes)
                        .saturating_add(value.len())
                        > output_limit
                    {
                        return Err(AgentError::BudgetExceeded("max_result_bytes".to_string()));
                    }
                    content.push_str(value);
                    emit(
                        context,
                        AgentEvent::ModelDelta {
                            content: value.clone(),
                        },
                    );
                }
                if let Some(value) = message_thinking(message) {
                    emit(
                        context,
                        AgentEvent::ThinkingDelta {
                            content: value.to_string(),
                        },
                    );
                }
                if let Some(calls) = &message.tool_calls {
                    tool_payload_bytes = serde_json::to_vec(calls)
                        .map(|value| value.len())
                        .unwrap_or(usize::MAX);
                    if content.len().saturating_add(tool_payload_bytes) > output_limit {
                        return Err(AgentError::BudgetExceeded("max_result_bytes".to_string()));
                    }
                    tool_calls = calls.clone();
                }
            }
        }
        if let Some(usage) = chunk.usage {
            if let Some(value) = usage.prompt_tokens {
                input_tokens = Some(u64::from(value));
            }
            if let Some(value) = usage.completion_tokens {
                output_tokens = Some(u64::from(value));
            }
            if let Some(value) = usage.total_tokens {
                total_tokens = Some(u64::from(value));
            }
        }
    }

    if let (Some(input), Some(output)) = (input_tokens, output_tokens) {
        total_tokens = Some(input.saturating_add(output));
    }

    Ok(ModelTurn {
        content,
        role,
        tool_calls,
        input_tokens,
        output_tokens,
        total_tokens,
    })
}

fn delta_thinking(delta: &otherone_ai::types::ResponseDelta) -> Option<std::borrow::Cow<'_, str>> {
    delta.visible_reasoning()
}

fn message_thinking(
    message: &otherone_ai::types::ResponseMessage,
) -> Option<std::borrow::Cow<'_, str>> {
    message.visible_reasoning()
}

fn merge_tool_call_delta(tool_calls: &mut Vec<ToolCall>, delta: &ToolCall) {
    let position = delta
        .index
        .and_then(|index| tool_calls.iter().position(|call| call.index == Some(index)))
        .or_else(|| {
            (!delta.id.is_empty())
                .then(|| tool_calls.iter().position(|call| call.id == delta.id))
                .flatten()
        });

    if let Some(position) = position {
        let target = &mut tool_calls[position];
        if !delta.id.is_empty() {
            target.id = delta.id.clone();
        }
        if !delta.function.name.is_empty() {
            target.function.name = delta.function.name.clone();
        }
        target
            .function
            .arguments
            .push_str(&delta.function.arguments);
        if delta.index.is_some() {
            target.index = delta.index;
        }
    } else {
        tool_calls.push(delta.clone());
    }
}

async fn persist_input(context: &RunContext, input: AgentInput) -> Result<(), AgentError> {
    match input {
        AgentInput::Text(value) => persist_entry(context, "user", &value, None, None).await,
        AgentInput::Messages(messages) => {
            for message in messages {
                let content = message_content_string(&message.content);
                let tools = message
                    .tool_calls
                    .as_ref()
                    .map(|calls| serde_json::json!({ "tool_calls": calls }));
                persist_entry(context, &message.role, &content, tools, None).await?;
            }
            Ok(())
        }
    }
}

fn message_content_string(content: &MessageContent) -> String {
    match content {
        MessageContent::Text(value) => value.clone(),
        MessageContent::MultiPart(value) => serde_json::to_string(value).unwrap_or_default(),
    }
}

async fn persist_assistant_response(
    context: &RunContext,
    response: &ModelTurn,
) -> Result<(), AgentError> {
    let tools = (!response.tool_calls.is_empty())
        .then(|| serde_json::json!({ "tool_calls": response.tool_calls }));
    persist_entry(
        context,
        &response.role,
        &response.content,
        tools,
        response
            .total_tokens
            .map(|value| value.min(u32::MAX as u64) as u32),
    )
    .await
}

async fn persist_tool_results(
    context: &RunContext,
    results: &[ToolResult],
) -> Result<(), AgentError> {
    for result in results {
        let content = match (&result.result, &result.error) {
            (Some(value), _) => serde_json::to_string(value).unwrap_or_else(|_| "null".to_string()),
            (None, Some(error)) => serde_json::json!({ "error": error }).to_string(),
            (None, None) => "null".to_string(),
        };
        let tools = serde_json::json!({
            "tool_call_id": result.tool_call_id,
            "function_name": result.function_name,
            "result": result.result,
            "error": result.error,
            "error_kind": result.error_kind,
        });
        persist_entry(context, "tool", &content, Some(tools), None).await?;
    }
    Ok(())
}

async fn persist_entry(
    context: &RunContext,
    role: &str,
    content: &str,
    tools: Option<serde_json::Value>,
    token_consumption: Option<u32>,
) -> Result<(), AgentError> {
    let storage_type = match context.session.storage_type {
        StorageType::LocalFile => StorageBackend::LocalFile,
        StorageType::Database => StorageBackend::Database,
    };
    otherone_storage::write_entry(&WriteEntryOptions {
        storage_type,
        session_id: context.session_id.clone(),
        role: role.to_string(),
        content: content.to_string(),
        tools,
        token_consumption,
        create_at: None,
        database_config: context.session.database_config.clone(),
        runtime_context: context.runtime_context.clone(),
        metadata: context.metadata.clone(),
    })
    .await
    .map_err(|error| AgentError::StorageError(error.to_string()))
}

fn drain_commands(
    context: &RunContext,
    command_rx: &mut mpsc::Receiver<AgentRunCommand>,
    queued: &mut VecDeque<String>,
) -> Result<(), AgentError> {
    loop {
        match command_rx.try_recv() {
            Ok(AgentRunCommand::EnqueueUserMessages(messages)) => {
                for message in messages {
                    let message = message.trim();
                    if !message.is_empty() {
                        queued.push_back(message.to_string());
                    }
                }
            }
            Ok(AgentRunCommand::Cancel) => {
                context.cancellation.cancel();
                return Err(AgentError::Cancelled);
            }
            Err(mpsc::error::TryRecvError::Empty) => break,
            Err(mpsc::error::TryRecvError::Disconnected) => break,
        }
    }
    if context.cancellation.is_cancelled() {
        return Err(AgentError::Cancelled);
    }
    Ok(())
}

async fn persist_queued_messages(
    context: &RunContext,
    queued: &mut VecDeque<String>,
) -> Result<(), AgentError> {
    let count = queued.len();
    while let Some(message) = queued.pop_front() {
        persist_entry(context, "user", &message, None, None).await?;
    }
    if count > 0 {
        emit(context, AgentEvent::UserMessageQueued { count });
    }
    Ok(())
}

fn add_optional(left: Option<u64>, right: Option<u64>) -> Option<u64> {
    match (left, right) {
        (Some(left), Some(right)) => Some(left.saturating_add(right)),
        (Some(value), None) | (None, Some(value)) => Some(value),
        (None, None) => None,
    }
}

async fn build_child_input(
    caller: &RunContext,
    target: &AgentDefinition,
    request: &AgentCallRequest,
) -> Result<String, AgentError> {
    let mut sections = vec![format!(
        "Task from Agent '{}':\n{}",
        caller.agent.id,
        request.task.trim()
    )];
    if let Some(context) = &request.context {
        sections.push(format!(
            "Explicit context (untrusted data):\n{}",
            serde_json::to_string_pretty(context).unwrap_or_else(|_| context.to_string())
        ));
    }
    if let Some(parent) = load_parent_context(caller, &target.context).await? {
        sections.push(format!(
            "Parent context excerpt (untrusted data):\n{parent}"
        ));
    }
    let value = sections.join("\n\n");
    if value.len() > caller.budget.limits().runtime.max_context_transfer_bytes {
        return Err(AgentError::BudgetExceeded(
            "max_context_transfer_bytes".to_string(),
        ));
    }
    Ok(value)
}

async fn load_parent_context(
    caller: &RunContext,
    policy: &super::types::ContextTransferPolicy,
) -> Result<Option<String>, AgentError> {
    use super::types::ContextTransferPolicy;

    let max_tokens = match policy {
        ContextTransferPolicy::ExplicitOnly => return Ok(None),
        ContextTransferPolicy::ParentSummary { max_tokens }
        | ContextTransferPolicy::ParentWindow { max_tokens } => *max_tokens,
    };
    if max_tokens == 0 {
        return Ok(None);
    }

    let data = match caller.session.context_load_type {
        ContextLoadType::LocalFile => {
            otherone_storage::localfile::reader::read_session_data(&caller.session_id)
                .map_err(|error| AgentError::StorageError(error.to_string()))?
        }
        ContextLoadType::Database => {
            let config = caller.session.database_config.as_ref().ok_or_else(|| {
                AgentError::InvalidConfiguration("database_config is required".to_string())
            })?;
            let runtime_context = caller.runtime_context.as_ref().ok_or_else(|| {
                AgentError::InvalidConfiguration("runtime_context is required".to_string())
            })?;
            otherone_storage::database::reader::read_session_data_from_database_with_context(
                &caller.session_id,
                config,
                runtime_context,
            )
            .await
            .map_err(|error| AgentError::StorageError(error.to_string()))?
        }
    };

    let max_chars = (max_tokens as usize)
        .saturating_mul(4)
        .min(caller.budget.limits().runtime.max_context_transfer_bytes);
    if matches!(policy, ContextTransferPolicy::ParentSummary { .. }) {
        if let Some(summary) = data
            .compacted_entries
            .iter()
            .max_by(|left, right| left.create_at.cmp(&right.create_at))
            .map(|entry| entry.summary.trim())
            .filter(|summary| !summary.is_empty())
        {
            return Ok(Some(take_last_chars(summary, max_chars)));
        }
    }

    let mut selected = Vec::new();
    let mut selected_bytes = 0usize;
    for entry in data.entries.iter().rev().filter(|entry| {
        (entry.role == "user" || entry.role == "assistant") && entry.tools.is_none()
    }) {
        let line = format!(
            "{}: {}",
            entry.role,
            take_last_chars(&entry.content, max_chars)
        );
        selected_bytes = selected_bytes.saturating_add(line.len());
        selected.push(line);
        if selected_bytes >= max_chars {
            break;
        }
    }
    selected.reverse();
    let safe_messages = selected.join("\n");
    if safe_messages.is_empty() {
        Ok(None)
    } else {
        Ok(Some(take_last_chars(&safe_messages, max_chars)))
    }
}

fn take_last_chars(value: &str, max_chars: usize) -> String {
    if max_chars == 0 {
        return String::new();
    }
    let start = value
        .char_indices()
        .rev()
        .nth(max_chars.saturating_sub(1))
        .map(|(index, _)| index)
        .unwrap_or(0);
    value[start..].to_string()
}

#[derive(Debug, Deserialize)]
struct AgentCallArguments {
    agent: String,
    task: String,
    context: Option<serde_json::Value>,
}

struct AgentCallToolHandler {
    runtime: Weak<RuntimeInner>,
}

#[async_trait]
impl ToolHandler for AgentCallToolHandler {
    async fn call(
        &self,
        arguments: serde_json::Value,
        context: ToolCallContext,
    ) -> Result<serde_json::Value, ToolError> {
        let arguments: AgentCallArguments = serde_json::from_value(arguments)
            .map_err(|error| ToolError::invalid_arguments(error.to_string()))?;
        let runtime = self.runtime.upgrade().ok_or_else(|| {
            ToolError::new(ToolErrorKind::Fatal, "Agent runtime has been dropped")
        })?;
        let caller_run_id = RunId::from_string(context.run_id)
            .map_err(|error| ToolError::invalid_arguments(error.to_string()))?;
        let call_id = if context.tool_call_id.is_empty() {
            AgentCallId::generated()
        } else {
            AgentCallId::new(context.tool_call_id)
                .map_err(|error| ToolError::invalid_arguments(error.to_string()))?
        };
        let request = AgentCallRequest {
            target: AgentId::unchecked(arguments.agent),
            task: arguments.task,
            context: arguments.context,
            result_contract: ResultContract::Auto,
            max_iterations: None,
            timeout: None,
            metadata: AttributeBag::new(),
        };

        let result = RuntimeInner::call_agent(runtime, &caller_run_id, call_id, request)
            .await
            .map_err(|error| ToolError::recoverable(error.to_string()))?;
        serde_json::to_value(result)
            .map_err(|error| ToolError::new(ToolErrorKind::Fatal, error.to_string()))
    }
}

fn agent_call_registration(runtime: Weak<RuntimeInner>) -> ToolRegistration {
    ToolRegistration::new(
        Tool {
            tool_type: "function".to_string(),
            function: FunctionDefinition {
                name: AGENT_CALL_TOOL_NAME.to_string(),
                description: "Call another Agent".to_string(),
                parameters: Some(serde_json::json!({
                    "type": "object",
                    "properties": {
                        "agent": { "type": "string" },
                        "task": { "type": "string" },
                        "context": { "type": "object" }
                    },
                    "required": ["agent", "task"]
                })),
            },
        },
        Arc::new(AgentCallToolHandler { runtime }),
    )
    .execution_class(ToolExecutionClass::Delegating)
}

#[derive(Debug, Deserialize)]
struct MemoryRecallArguments {
    #[serde(default)]
    memory_types: Vec<String>,
}

struct MemoryRecallHandler {
    lock: Arc<Mutex<()>>,
}

#[async_trait]
impl ToolHandler for MemoryRecallHandler {
    async fn call(
        &self,
        arguments: serde_json::Value,
        context: ToolCallContext,
    ) -> Result<serde_json::Value, ToolError> {
        let arguments: MemoryRecallArguments = serde_json::from_value(arguments)
            .map_err(|error| ToolError::invalid_arguments(error.to_string()))?;
        if arguments.memory_types.is_empty() {
            return Err(ToolError::invalid_arguments("memory_types is required"));
        }
        let _guard = self.lock.lock().await;
        let tree = otherone_memory::read_memory_tree()
            .map_err(|error| ToolError::new(ToolErrorKind::Fatal, error.to_string()))?;
        let scope = memory_scope(&context);
        let queries = arguments
            .memory_types
            .iter()
            .map(|value| value.trim().to_lowercase())
            .filter(|value| !value.is_empty())
            .collect::<Vec<_>>();
        let memories = tree
            .iter_points()
            .filter(|point| point.is_active())
            .filter_map(|point| {
                let types = point.types.as_deref()?;
                let unscoped = types.strip_prefix(&scope)?;
                queries
                    .iter()
                    .any(|query| {
                        let value = unscoped.to_lowercase();
                        value.contains(query) || query.contains(&value)
                    })
                    .then(|| point.storage.clone())
                    .flatten()
            })
            .take(64)
            .collect::<Vec<_>>();
        Ok(serde_json::json!({ "memories": memories }))
    }
}

#[derive(Debug, Deserialize)]
struct MemoryStoreArguments {
    storage: String,
    types: String,
}

struct MemoryStoreHandler {
    lock: Arc<Mutex<()>>,
}

#[async_trait]
impl ToolHandler for MemoryStoreHandler {
    async fn call(
        &self,
        arguments: serde_json::Value,
        context: ToolCallContext,
    ) -> Result<serde_json::Value, ToolError> {
        let arguments: MemoryStoreArguments = serde_json::from_value(arguments)
            .map_err(|error| ToolError::invalid_arguments(error.to_string()))?;
        let storage = arguments.storage.trim();
        let types = arguments.types.trim();
        if storage.is_empty() || types.is_empty() {
            return Err(ToolError::invalid_arguments(
                "storage and types are required",
            ));
        }
        if contains_sensitive_memory(storage) {
            return Err(ToolError::new(
                ToolErrorKind::PermissionDenied,
                "sensitive values must not be stored in long-term memory",
            ));
        }
        let _guard = self.lock.lock().await;
        let mut tree = otherone_memory::read_memory_tree()
            .map_err(|error| ToolError::new(ToolErrorKind::Fatal, error.to_string()))?;
        let mut point = otherone_memory::MemoryPoint::new_root(
            storage,
            format!("{}{}", memory_scope(&context), types),
        )
        .map_err(|error| ToolError::recoverable(error.to_string()))?;
        point
            .set_attribute("source_run_id", serde_json::json!(context.run_id))
            .map_err(|error| ToolError::recoverable(error.to_string()))?;
        point
            .set_attribute("source_agent_id", serde_json::json!(context.agent_id))
            .map_err(|error| ToolError::recoverable(error.to_string()))?;
        if let Some(session_id) = &context.session_id {
            point
                .set_attribute("source_session_id", serde_json::json!(session_id))
                .map_err(|error| ToolError::recoverable(error.to_string()))?;
        }
        let point_id = tree
            .insert_point(point)
            .map_err(|error| ToolError::recoverable(error.to_string()))?;
        otherone_memory::write_memory_tree(&tree)
            .map_err(|error| ToolError::new(ToolErrorKind::Fatal, error.to_string()))?;
        Ok(serde_json::json!({ "stored": true, "point_id": point_id }))
    }
}

fn memory_scope(context: &ToolCallContext) -> String {
    let partition = context
        .runtime_context
        .as_ref()
        .and_then(|value| value.get("partition_key"))
        .and_then(|value| value.as_str())
        .unwrap_or("default");
    let private = context
        .metadata
        .get("memory_policy")
        .and_then(|value| value.as_str())
        == Some("private_agent");
    if private {
        format!("[scope:{partition}:agent:{}] ", context.agent_id)
    } else {
        format!("[scope:{partition}] ")
    }
}

fn contains_sensitive_memory(value: &str) -> bool {
    let value = value.to_lowercase();
    [
        "api key",
        "api_key",
        "password",
        "密码",
        "验证码",
        "verification code",
        "credit card",
        "银行卡",
    ]
    .iter()
    .any(|pattern| value.contains(pattern))
}

fn memory_recall_registration(lock: Arc<Mutex<()>>) -> ToolRegistration {
    ToolRegistration::new(
        Tool {
            tool_type: "function".to_string(),
            function: FunctionDefinition {
                name: MEMORY_RECALL_TOOL_NAME.to_string(),
                description: "Recall scoped long-term memories by semantic type.".to_string(),
                parameters: Some(serde_json::json!({
                    "type": "object",
                    "properties": {
                        "memory_types": {
                            "type": "array",
                            "items": { "type": "string" },
                            "minItems": 1,
                            "maxItems": 8
                        }
                    },
                    "required": ["memory_types"],
                    "additionalProperties": false
                })),
            },
        },
        Arc::new(MemoryRecallHandler { lock }),
    )
}

fn memory_store_registration(lock: Arc<Mutex<()>>) -> ToolRegistration {
    ToolRegistration::new(
        Tool {
            tool_type: "function".to_string(),
            function: FunctionDefinition {
                name: MEMORY_STORE_TOOL_NAME.to_string(),
                description: "Store one durable, non-sensitive long-term memory.".to_string(),
                parameters: Some(serde_json::json!({
                    "type": "object",
                    "properties": {
                        "storage": { "type": "string" },
                        "types": { "type": "string" }
                    },
                    "required": ["storage", "types"],
                    "additionalProperties": false
                })),
            },
        },
        Arc::new(MemoryStoreHandler { lock }),
    )
}

fn global_memory_lock() -> Arc<Mutex<()>> {
    static LOCK: std::sync::OnceLock<Arc<Mutex<()>>> = std::sync::OnceLock::new();
    Arc::clone(LOCK.get_or_init(|| Arc::new(Mutex::new(()))))
}

#[cfg(test)]
mod tests {
    use std::pin::Pin;
    use std::sync::atomic::AtomicUsize as TestAtomicUsize;
    use std::sync::OnceLock;

    use futures::stream;
    use otherone_ai::types::{ChatResponse, Choice, ResponseDelta, Usage};

    use super::*;
    use crate::multi_agent::RunLimitOverrides;

    struct MockModelExecutor {
        responses: Mutex<VecDeque<ChatResponse>>,
        configs: Mutex<Vec<serde_json::Value>>,
    }

    impl MockModelExecutor {
        fn new(responses: Vec<ChatResponse>) -> Self {
            Self {
                responses: Mutex::new(responses.into()),
                configs: Mutex::new(Vec::new()),
            }
        }

        async fn configs(&self) -> Vec<serde_json::Value> {
            self.configs.lock().await.clone()
        }
    }

    #[async_trait]
    impl ModelExecutor for MockModelExecutor {
        async fn stream(
            &self,
            _profile: &ModelProfile,
            config: serde_json::Value,
        ) -> Result<ChatStream, AiError> {
            self.configs.lock().await.push(config);
            let response = self
                .responses
                .lock()
                .await
                .pop_front()
                .ok_or_else(|| AiError::Other("no mock response".to_string()))?;
            Ok(Box::pin(stream::iter(vec![Ok(response)])) as Pin<Box<_>>)
        }
    }

    fn response(content: &str, tool_calls: Option<Vec<ToolCall>>) -> ChatResponse {
        ChatResponse {
            id: Some(uuid::Uuid::new_v4().to_string()),
            object: None,
            created: None,
            model: Some("mock".to_string()),
            choices: vec![Choice {
                index: 0,
                message: None,
                delta: Some(ResponseDelta {
                    role: Some("assistant".to_string()),
                    content: Some(content.to_string()),
                    reasoning_content: None,
                    reasoning: None,
                    thinking: None,
                    thought: None,
                    reasoning_details: None,
                    tool_calls,
                }),
                finish_reason: Some("stop".to_string()),
            }],
            usage: Some(Usage {
                details: Default::default(),
                prompt_tokens: Some(2),
                completion_tokens: Some(1),
                total_tokens: Some(3),
                cost: None,
            }),
        }
    }

    fn profile() -> ModelProfile {
        ModelProfile::builder("default", otherone_ai::types::ProviderType::OpenAI, "mock")
            .api_key("test")
            .base_url("http://localhost")
            .build()
            .unwrap()
    }

    fn temp_storage() -> std::path::PathBuf {
        std::env::temp_dir().join(format!("otherone-multi-agent-{}", uuid::Uuid::new_v4()))
    }

    #[test]
    fn memory_policy_controls_builtin_memory_tools() {
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("reader")
                    .description("reader")
                    .memory(MemoryPolicy::ReadOnlyShared)
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("writer")
                    .description("writer")
                    .memory(MemoryPolicy::ReadWriteShared)
                    .build()
                    .unwrap(),
            )
            .build()
            .unwrap();
        let snapshot = runtime.snapshot();
        let reader = snapshot.agent(&AgentId::new("reader").unwrap()).unwrap();
        let writer = snapshot.agent(&AgentId::new("writer").unwrap()).unwrap();
        let reader_tools = snapshot.tool_names_for(&reader);
        let writer_tools = snapshot.tool_names_for(&writer);
        assert!(reader_tools.contains(MEMORY_RECALL_TOOL_NAME));
        assert!(!reader_tools.contains(MEMORY_STORE_TOOL_NAME));
        assert!(writer_tools.contains(MEMORY_RECALL_TOOL_NAME));
        assert!(writer_tools.contains(MEMORY_STORE_TOOL_NAME));
    }

    #[tokio::test]
    async fn memory_writes_include_run_session_and_agent_provenance() {
        let _guard = storage_guard().await;
        otherone_memory::set_memory_storage_root(temp_storage());
        let handler = MemoryStoreHandler {
            lock: global_memory_lock(),
        };
        let mut context =
            ToolCallContext::new("run-1", "root-1", "agent-1", CancellationToken::new());
        context.session_id = Some("session-1".to_string());
        context.metadata = serde_json::json!({ "memory_policy": "read_write_shared" });

        let result = handler
            .call(
                serde_json::json!({
                    "storage": "The user prefers concise answers",
                    "types": "response preference"
                }),
                context,
            )
            .await
            .unwrap();
        let point_id = result["point_id"].as_str().unwrap();
        let tree = otherone_memory::read_memory_tree().unwrap();
        let point = tree.get(point_id).unwrap();
        assert_eq!(point.attributes["source_run_id"], "run-1");
        assert_eq!(point.attributes["source_session_id"], "session-1");
        assert_eq!(point.attributes["source_agent_id"], "agent-1");
        otherone_memory::clear_memory_storage_root();
    }

    #[test]
    fn agent_skill_policy_filters_the_runtime_skill_snapshot() {
        let root = std::env::temp_dir().join(format!("otherone-skill-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&root).unwrap();
        let skill_path = root.join("SKILL.md");
        std::fs::write(
            &skill_path,
            "---\nname: test-skill\ndescription: Test skill description\n---\n\n# Test\n",
        )
        .unwrap();
        let registry =
            otherone_skills::SkillRegistry::load_from_config(&otherone_skills::SkillsConfig {
                include_defaults: false,
                user_skills_dir: None,
                project_skills_dir: None,
                extra_paths: vec![skill_path],
                cwd: root,
            })
            .unwrap();
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("agent")
                    .allow_skills(["test-skill"])
                    .build()
                    .unwrap(),
            )
            .skills(&registry)
            .build()
            .unwrap();
        let snapshot = runtime.snapshot();
        let agent = snapshot.agent(&AgentId::new("agent").unwrap()).unwrap();
        let prompt = snapshot
            .skills
            .format_for_prompt(&snapshot.skill_policy_for(&agent));
        assert!(prompt.contains("test-skill"));
        assert!(prompt.contains("Test skill description"));
    }

    async fn storage_guard() -> tokio::sync::MutexGuard<'static, ()> {
        static LOCK: OnceLock<tokio::sync::Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| tokio::sync::Mutex::new(()))
            .lock()
            .await
    }

    fn agent_call(id: &str, target: &str, task: &str) -> ToolCall {
        ToolCall {
            index: Some(0),
            id: id.to_string(),
            call_type: "function".to_string(),
            function: otherone_ai::types::FunctionCall {
                name: AGENT_CALL_TOOL_NAME.to_string(),
                arguments: serde_json::json!({ "agent": target, "task": task }).to_string(),
            },
        }
    }

    #[tokio::test]
    async fn runs_a_root_agent_with_the_unified_runner() {
        let _guard = storage_guard().await;
        let root = temp_storage();
        otherone_storage::localfile::set_storage_root(root);
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("test agent")
                    .build()
                    .unwrap(),
            )
            .model_executor(Arc::new(MockModelExecutor::new(vec![response(
                "done", None,
            )])))
            .build()
            .unwrap();

        let result = runtime
            .run(AgentRunRequest::new("agent", "hello"))
            .await
            .unwrap();
        assert_eq!(result.outcome, RunOutcome::Completed);
        assert_eq!(result.output, Some(AgentOutput::Text("done".to_string())));
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn model_config_uses_provider_specific_parameter_names() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());

        let anthropic_executor = Arc::new(MockModelExecutor::new(vec![response("done", None)]));
        let anthropic = AgentRuntime::builder()
            .register_model(
                ModelProfile::builder(
                    "default",
                    otherone_ai::types::ProviderType::Anthropic,
                    "mock",
                )
                .api_key("test")
                .base_url("http://localhost")
                .max_tokens(321)
                .top_p(0.4)
                .build()
                .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("agent")
                    .build()
                    .unwrap(),
            )
            .model_executor(anthropic_executor.clone())
            .build()
            .unwrap();
        anthropic
            .run(AgentRunRequest::new("agent", "start"))
            .await
            .unwrap();
        let anthropic_config = anthropic_executor.configs().await.remove(0);
        assert_eq!(anthropic_config["max_tokens"], 321);
        assert!((anthropic_config["topP"].as_f64().unwrap() - 0.4).abs() < f64::from(f32::EPSILON));
        assert!(anthropic_config.get("maxTokens").is_none());

        let fetch_executor = Arc::new(MockModelExecutor::new(vec![response("done", None)]));
        let fetch = AgentRuntime::builder()
            .register_model(
                ModelProfile::builder("default", otherone_ai::types::ProviderType::Fetch, "mock")
                    .api_key("test")
                    .base_url("http://localhost")
                    .context_length(2048)
                    .top_p(0.6)
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("agent")
                    .build()
                    .unwrap(),
            )
            .model_executor(fetch_executor.clone())
            .build()
            .unwrap();
        fetch
            .run(AgentRunRequest::new("agent", "start"))
            .await
            .unwrap();
        let fetch_config = fetch_executor.configs().await.remove(0);
        assert_eq!(fetch_config["max_tokens"], 2048);
        assert!((fetch_config["top_p"].as_f64().unwrap() - 0.6).abs() < f64::from(f32::EPSILON));
        assert!(fetch_config.get("topP").is_none());

        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn streaming_output_limit_stops_before_persisting_the_oversized_message() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("agent")
                    .build()
                    .unwrap(),
            )
            .runtime_limits(RuntimeLimits {
                max_result_bytes: 4,
                ..Default::default()
            })
            .model_executor(Arc::new(MockModelExecutor::new(vec![response(
                "oversized",
                None,
            )])))
            .build()
            .unwrap();

        let result = runtime
            .run(AgentRunRequest::new("agent", "start"))
            .await
            .unwrap();
        assert_eq!(result.outcome, RunOutcome::BudgetExceeded);
        let session =
            otherone_storage::localfile::reader::read_session_data(&result.session_id).unwrap();
        assert_eq!(session.entries.len(), 1);
        assert_eq!(session.entries[0].role, "user");
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn agent_call_executes_child_and_returns_to_parent() {
        let _guard = storage_guard().await;
        let root = temp_storage();
        otherone_storage::localfile::set_storage_root(root);
        let call = agent_call("call_1", "worker", "do work");
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("coordinator")
                    .description("coordinates")
                    .allow_agents(["worker"])
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("worker")
                    .description("works")
                    .build()
                    .unwrap(),
            )
            .model_executor(Arc::new(MockModelExecutor::new(vec![
                response("", Some(vec![call])),
                response("worker result", None),
                response("final answer", None),
            ])))
            .build()
            .unwrap();

        let result = runtime
            .run(AgentRunRequest::new("coordinator", "start"))
            .await
            .unwrap();
        assert_eq!(result.outcome, RunOutcome::Completed);
        assert_eq!(
            result.output,
            Some(AgentOutput::Text("final answer".to_string()))
        );
        let records = runtime.list_run_tree(&result.root_run_id).await;
        assert_eq!(records.len(), 2);
        assert!(records
            .iter()
            .any(|record| record.agent_id.as_str() == "worker"));
        assert_eq!(
            otherone_storage::localfile::reader::get_all_sessions()
                .unwrap()
                .len(),
            1
        );
        assert_eq!(
            otherone_storage::localfile::reader::get_all_sessions_with_internal(true)
                .unwrap()
                .len(),
            2
        );
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn child_context_is_isolated_from_parent_history() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let executor = Arc::new(MockModelExecutor::new(vec![
            response("", Some(vec![agent_call("call_1", "worker", "child task")])),
            response("child done", None),
            response("root done", None),
        ]));
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("root")
                    .description("root")
                    .allow_agents(["worker"])
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("worker")
                    .description("worker")
                    .build()
                    .unwrap(),
            )
            .model_executor(executor.clone())
            .build()
            .unwrap();

        runtime
            .run(AgentRunRequest::new("root", "parent private history"))
            .await
            .unwrap();
        let configs = executor.configs().await;
        let child_messages = configs[1]["messages"].to_string();
        assert!(child_messages.contains("child task"));
        assert!(!child_messages.contains("parent private history"));
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn model_cannot_execute_a_registered_but_disallowed_tool() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let executions = Arc::new(TestAtomicUsize::new(0));
        let counter = Arc::clone(&executions);
        let dangerous_tool = ToolRegistration::sync(
            Tool {
                tool_type: "function".to_string(),
                function: FunctionDefinition {
                    name: "dangerous".to_string(),
                    description: "dangerous".to_string(),
                    parameters: None,
                },
            },
            move |_| {
                counter.fetch_add(1, Ordering::SeqCst);
                "executed".to_string()
            },
        );
        let hallucinated_call = ToolCall {
            index: Some(0),
            id: "call_dangerous".to_string(),
            call_type: "function".to_string(),
            function: otherone_ai::types::FunctionCall {
                name: "dangerous".to_string(),
                arguments: "{}".to_string(),
            },
        };
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("agent")
                    .build()
                    .unwrap(),
            )
            .register_tool(dangerous_tool)
            .model_executor(Arc::new(MockModelExecutor::new(vec![
                response("", Some(vec![hallucinated_call])),
                response("done", None),
            ])))
            .build()
            .unwrap();

        let result = runtime
            .run(AgentRunRequest::new("agent", "start"))
            .await
            .unwrap();
        assert_eq!(result.outcome, RunOutcome::Completed);
        assert_eq!(executions.load(Ordering::SeqCst), 0);
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn fatal_tool_errors_terminate_the_current_run() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let fatal_tool = ToolRegistration::sync(
            Tool {
                tool_type: "function".to_string(),
                function: FunctionDefinition {
                    name: "fatal_tool".to_string(),
                    description: "fails fatally".to_string(),
                    parameters: None,
                },
            },
            |_| -> String { panic!("fatal tool panic") },
        );
        let call = ToolCall {
            index: Some(0),
            id: "call_fatal".to_string(),
            call_type: "function".to_string(),
            function: otherone_ai::types::FunctionCall {
                name: "fatal_tool".to_string(),
                arguments: "{}".to_string(),
            },
        };
        let executor = Arc::new(MockModelExecutor::new(vec![response("", Some(vec![call]))]));
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("agent")
                    .allow_tools(["fatal_tool"])
                    .build()
                    .unwrap(),
            )
            .register_tool(fatal_tool)
            .model_executor(executor.clone())
            .build()
            .unwrap();

        let result = runtime
            .run(AgentRunRequest::new("agent", "start"))
            .await
            .unwrap();
        assert!(matches!(
            &result.outcome,
            RunOutcome::Failed(AgentFailure { code, .. }) if code == "tool_error"
        ));
        assert_eq!(result.usage.model_calls, 1);
        assert_eq!(result.usage.tool_calls, 1);
        assert_eq!(executor.configs().await.len(), 1);
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn denies_agent_call_cycles_without_starting_a_third_run() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("agent_a")
                    .description("A")
                    .allow_agents(["agent_b"])
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("agent_b")
                    .description("B")
                    .allow_agents(["agent_a"])
                    .build()
                    .unwrap(),
            )
            .model_executor(Arc::new(MockModelExecutor::new(vec![
                response("", Some(vec![agent_call("call_b", "agent_b", "go to B")])),
                response(
                    "",
                    Some(vec![agent_call("call_a", "agent_a", "go back to A")]),
                ),
                response("B handled cycle", None),
                response("A final", None),
            ])))
            .build()
            .unwrap();

        let result = runtime
            .run(AgentRunRequest::new("agent_a", "start"))
            .await
            .unwrap();
        assert_eq!(result.outcome, RunOutcome::Completed);
        let records = runtime.list_run_tree(&result.root_run_id).await;
        assert_eq!(records.len(), 2);
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn nested_call_does_not_deadlock_with_concurrency_one() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let limits = RuntimeLimits {
            max_concurrent_model_calls: 1,
            max_concurrent_tool_calls: 1,
            ..RuntimeLimits::default()
        };
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("root")
                    .description("root")
                    .allow_agents(["worker"])
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("worker")
                    .description("worker")
                    .build()
                    .unwrap(),
            )
            .runtime_limits(limits)
            .model_executor(Arc::new(MockModelExecutor::new(vec![
                response("", Some(vec![agent_call("call_1", "worker", "work")])),
                response("worked", None),
                response("done", None),
            ])))
            .build()
            .unwrap();

        let result = tokio::time::timeout(
            Duration::from_secs(2),
            runtime.run(AgentRunRequest::new("root", "start")),
        )
        .await
        .expect("nested Agent call deadlocked")
        .unwrap();
        assert_eq!(result.outcome, RunOutcome::Completed);
        otherone_storage::localfile::clear_storage_root();
    }

    struct PendingModelExecutor;

    #[async_trait]
    impl ModelExecutor for PendingModelExecutor {
        async fn stream(
            &self,
            _profile: &ModelProfile,
            _config: serde_json::Value,
        ) -> Result<ChatStream, AiError> {
            Ok(Box::pin(stream::pending()))
        }
    }

    struct RootThenPendingModelExecutor {
        calls: TestAtomicUsize,
    }

    #[async_trait]
    impl ModelExecutor for RootThenPendingModelExecutor {
        async fn stream(
            &self,
            _profile: &ModelProfile,
            _config: serde_json::Value,
        ) -> Result<ChatStream, AiError> {
            if self.calls.fetch_add(1, Ordering::SeqCst) == 0 {
                Ok(Box::pin(stream::iter(vec![Ok(response(
                    "",
                    Some(vec![agent_call("call_1", "worker", "wait")]),
                ))])))
            } else {
                Ok(Box::pin(stream::pending()))
            }
        }
    }

    struct RootPendingThenInvalidJsonExecutor {
        calls: TestAtomicUsize,
    }

    #[async_trait]
    impl ModelExecutor for RootPendingThenInvalidJsonExecutor {
        async fn stream(
            &self,
            _profile: &ModelProfile,
            _config: serde_json::Value,
        ) -> Result<ChatStream, AiError> {
            if self.calls.fetch_add(1, Ordering::SeqCst) == 0 {
                Ok(Box::pin(stream::pending()))
            } else {
                Ok(Box::pin(stream::iter(vec![Ok(response("not json", None))])))
            }
        }
    }

    struct GatedModelExecutor {
        calls: TestAtomicUsize,
        release: Arc<tokio::sync::Semaphore>,
    }

    #[async_trait]
    impl ModelExecutor for GatedModelExecutor {
        async fn stream(
            &self,
            _profile: &ModelProfile,
            _config: serde_json::Value,
        ) -> Result<ChatStream, AiError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            self.release
                .acquire()
                .await
                .map_err(|_| AiError::Other("gate closed".to_string()))?
                .forget();
            Ok(Box::pin(stream::iter(vec![Ok(response("once", None))])))
        }
    }

    struct RootPendingWorkerGatedExecutor {
        calls: TestAtomicUsize,
        release: Arc<tokio::sync::Semaphore>,
    }

    #[async_trait]
    impl ModelExecutor for RootPendingWorkerGatedExecutor {
        async fn stream(
            &self,
            _profile: &ModelProfile,
            _config: serde_json::Value,
        ) -> Result<ChatStream, AiError> {
            let call = self.calls.fetch_add(1, Ordering::SeqCst);
            if call == 0 {
                return Ok(Box::pin(stream::pending()));
            }
            self.release
                .acquire()
                .await
                .map_err(|_| AiError::Other("gate closed".to_string()))?
                .forget();
            Ok(Box::pin(stream::iter(vec![Ok(response("worked", None))])))
        }
    }

    #[tokio::test]
    async fn cancellation_stops_an_active_root_run() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("agent")
                    .build()
                    .unwrap(),
            )
            .model_executor(Arc::new(PendingModelExecutor))
            .build()
            .unwrap();
        let handle = runtime
            .start(AgentRunRequest::new("agent", "wait"))
            .await
            .unwrap();
        handle.commands.cancel().await.unwrap();
        let result = tokio::time::timeout(Duration::from_secs(2), handle.result())
            .await
            .expect("cancelled run did not finish")
            .unwrap();
        assert_eq!(result.outcome, RunOutcome::Cancelled);
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn request_root_timeout_tightens_the_runtime_deadline() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("agent")
                    .build()
                    .unwrap(),
            )
            .model_executor(Arc::new(PendingModelExecutor))
            .build()
            .unwrap();
        let request = AgentRunRequest::new("agent", "wait").limits(RunLimitOverrides {
            root_timeout: Some(Duration::from_millis(20)),
            ..Default::default()
        });
        let result = tokio::time::timeout(Duration::from_secs(2), runtime.run(request))
            .await
            .expect("request root timeout was not applied")
            .unwrap();
        assert_eq!(result.outcome, RunOutcome::TimedOut);
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn root_cancellation_finishes_and_unregisters_active_children() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("root")
                    .description("root")
                    .allow_agents(["worker"])
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("worker")
                    .description("worker")
                    .build()
                    .unwrap(),
            )
            .model_executor(Arc::new(RootThenPendingModelExecutor {
                calls: TestAtomicUsize::new(0),
            }))
            .build()
            .unwrap();
        let handle = runtime
            .start(AgentRunRequest::new("root", "start"))
            .await
            .unwrap();
        let root_run_id = handle.run_id.clone();
        let child_run_id = tokio::time::timeout(Duration::from_secs(2), async {
            loop {
                if let Some(record) = runtime
                    .list_run_tree(&root_run_id)
                    .await
                    .into_iter()
                    .find(|record| record.depth == 1)
                {
                    break record.run_id;
                }
                tokio::task::yield_now().await;
            }
        })
        .await
        .expect("child run did not start");

        handle.commands.cancel().await.unwrap();
        let root_result = tokio::time::timeout(Duration::from_secs(2), handle.result())
            .await
            .expect("cancelled root run did not finish")
            .unwrap();
        assert_eq!(root_result.outcome, RunOutcome::Cancelled);

        tokio::time::timeout(Duration::from_secs(2), async {
            loop {
                if runtime
                    .get_run(&child_run_id)
                    .await
                    .is_some_and(|record| matches!(record.status, RunStatus::Cancelled))
                {
                    break;
                }
                tokio::task::yield_now().await;
            }
        })
        .await
        .expect("cancelled child run did not finish");
        assert!(runtime.cancel(&child_run_id).await.is_err());
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn invalid_child_result_contract_updates_the_child_run_status() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let executor = Arc::new(RootPendingThenInvalidJsonExecutor {
            calls: TestAtomicUsize::new(0),
        });
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("root")
                    .description("root")
                    .allow_agents(["worker"])
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("worker")
                    .description("worker")
                    .build()
                    .unwrap(),
            )
            .model_executor(executor.clone())
            .build()
            .unwrap();
        let handle = runtime
            .start(AgentRunRequest::new("root", "wait"))
            .await
            .unwrap();
        tokio::time::timeout(Duration::from_secs(2), async {
            while executor.calls.load(Ordering::SeqCst) == 0 {
                tokio::task::yield_now().await;
            }
        })
        .await
        .expect("root model call did not start");

        let call_result = runtime
            .call_agent(
                &handle.run_id,
                AgentCallId::new("trusted-call").unwrap(),
                AgentCallRequest::new("worker", "return JSON")
                    .result_contract(ResultContract::Json { schema: None }),
            )
            .await
            .unwrap();
        assert!(matches!(
            &call_result.outcome,
            RunOutcome::Failed(AgentFailure { code, .. }) if code == "invalid_agent_output"
        ));
        let child = runtime
            .get_run(call_result.run_id.as_ref().unwrap())
            .await
            .unwrap();
        assert!(matches!(child.status, RunStatus::Failed));
        assert!(matches!(
            &child.failure,
            Some(AgentFailure { code, .. }) if code == "invalid_agent_output"
        ));

        handle.commands.cancel().await.unwrap();
        let _ = handle.result().await.unwrap();
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn session_writer_lock_is_shared_across_runtimes() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let build_runtime = || {
            AgentRuntime::builder()
                .register_model(profile())
                .register_agent(
                    AgentDefinition::builder("agent")
                        .description("agent")
                        .build()
                        .unwrap(),
                )
                .model_executor(Arc::new(PendingModelExecutor))
                .build()
                .unwrap()
        };
        let first_runtime = build_runtime();
        let second_runtime = build_runtime();
        let request = AgentRunRequest::new("agent", "wait")
            .session(super::super::types::SessionTarget::local().session_id("shared-session"));
        let first = first_runtime.start(request.clone()).await.unwrap();
        let second = second_runtime.start(request).await;
        assert!(matches!(second, Err(AgentError::SessionBusy(_))));
        first.commands.cancel().await.unwrap();
        let _ = first.result().await.unwrap();
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn root_idempotency_returns_the_original_result() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let executor = Arc::new(MockModelExecutor::new(vec![response("once", None)]));
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("agent")
                    .build()
                    .unwrap(),
            )
            .model_executor(executor.clone())
            .build()
            .unwrap();
        let request = AgentRunRequest::new("agent", "hello").idempotency_key("request-1");
        let first = runtime.run(request.clone()).await.unwrap();
        let second = runtime.run(request).await.unwrap();
        assert_eq!(first.run_id, second.run_id);
        assert_eq!(executor.configs().await.len(), 1);
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn root_idempotency_survives_a_cancelled_waiter() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let release = Arc::new(tokio::sync::Semaphore::new(0));
        let executor = Arc::new(GatedModelExecutor {
            calls: TestAtomicUsize::new(0),
            release: Arc::clone(&release),
        });
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("agent")
                    .description("agent")
                    .build()
                    .unwrap(),
            )
            .model_executor(executor.clone())
            .build()
            .unwrap();
        let request = AgentRunRequest::new("agent", "hello").idempotency_key("request-1");
        let first_runtime = runtime.clone();
        let first_request = request.clone();
        let first_waiter = tokio::spawn(async move { first_runtime.run(first_request).await });
        tokio::time::timeout(Duration::from_secs(2), async {
            while executor.calls.load(Ordering::SeqCst) == 0 {
                tokio::task::yield_now().await;
            }
        })
        .await
        .expect("idempotent producer did not start");
        first_waiter.abort();
        let _ = first_waiter.await;
        release.add_permits(1);

        let result = tokio::time::timeout(Duration::from_secs(2), runtime.run(request))
            .await
            .expect("replacement waiter did not receive the cached result")
            .unwrap();
        assert_eq!(result.output, Some(AgentOutput::Text("once".to_string())));
        assert_eq!(executor.calls.load(Ordering::SeqCst), 1);
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn repeated_agent_call_id_executes_child_once() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let executor = Arc::new(MockModelExecutor::new(vec![
            response("", Some(vec![agent_call("same_call", "worker", "work")])),
            response("worked once", None),
            response("", Some(vec![agent_call("same_call", "worker", "work")])),
            response("done", None),
        ]));
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("root")
                    .description("root")
                    .allow_agents(["worker"])
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("worker")
                    .description("worker")
                    .build()
                    .unwrap(),
            )
            .model_executor(executor.clone())
            .build()
            .unwrap();

        let result = runtime
            .run(AgentRunRequest::new("root", "start"))
            .await
            .unwrap();
        assert_eq!(runtime.list_run_tree(&result.root_run_id).await.len(), 2);
        assert_eq!(executor.configs().await.len(), 4);
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn agent_call_idempotency_survives_a_cancelled_waiter() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let release = Arc::new(tokio::sync::Semaphore::new(0));
        let executor = Arc::new(RootPendingWorkerGatedExecutor {
            calls: TestAtomicUsize::new(0),
            release: Arc::clone(&release),
        });
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("root")
                    .description("root")
                    .allow_agents(["worker"])
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("worker")
                    .description("worker")
                    .build()
                    .unwrap(),
            )
            .model_executor(executor.clone())
            .build()
            .unwrap();
        let handle = runtime
            .start(AgentRunRequest::new("root", "wait"))
            .await
            .unwrap();
        tokio::time::timeout(Duration::from_secs(2), async {
            while executor.calls.load(Ordering::SeqCst) == 0 {
                tokio::task::yield_now().await;
            }
        })
        .await
        .expect("root model call did not start");

        let first_runtime = runtime.clone();
        let caller_run_id = handle.run_id.clone();
        let first_waiter = tokio::spawn(async move {
            first_runtime
                .call_agent(
                    &caller_run_id,
                    AgentCallId::new("stable-call").unwrap(),
                    AgentCallRequest::new("worker", "work"),
                )
                .await
        });
        tokio::time::timeout(Duration::from_secs(2), async {
            while executor.calls.load(Ordering::SeqCst) < 2 {
                tokio::task::yield_now().await;
            }
        })
        .await
        .expect("child model call did not start");
        first_waiter.abort();
        let _ = first_waiter.await;
        release.add_permits(1);

        let result = tokio::time::timeout(
            Duration::from_secs(2),
            runtime.call_agent(
                &handle.run_id,
                AgentCallId::new("stable-call").unwrap(),
                AgentCallRequest::new("worker", "work"),
            ),
        )
        .await
        .expect("replacement Agent-call waiter did not receive the result")
        .unwrap();
        assert_eq!(result.output, Some(AgentOutput::Text("worked".to_string())));
        assert_eq!(executor.calls.load(Ordering::SeqCst), 2);
        assert_eq!(runtime.list_run_tree(&handle.run_id).await.len(), 2);

        handle.commands.cancel().await.unwrap();
        let _ = handle.result().await.unwrap();
        otherone_storage::localfile::clear_storage_root();
    }

    #[tokio::test]
    async fn event_stream_contains_parent_and_child_lineage() {
        let _guard = storage_guard().await;
        otherone_storage::localfile::set_storage_root(temp_storage());
        let runtime = AgentRuntime::builder()
            .register_model(profile())
            .register_agent(
                AgentDefinition::builder("root")
                    .description("root")
                    .allow_agents(["worker"])
                    .build()
                    .unwrap(),
            )
            .register_agent(
                AgentDefinition::builder("worker")
                    .description("worker")
                    .build()
                    .unwrap(),
            )
            .model_executor(Arc::new(MockModelExecutor::new(vec![
                response("", Some(vec![agent_call("call_1", "worker", "work")])),
                response("worked", None),
                response("done", None),
            ])))
            .build()
            .unwrap();
        let mut handle = runtime
            .start(AgentRunRequest::new("root", "start"))
            .await
            .unwrap();
        let mut events = Vec::new();
        while let Some(event) = handle.events.recv().await {
            events.push(event);
        }
        let result = handle.result().await.unwrap();
        assert!(events.iter().any(|event| event.run_id == result.run_id));
        assert!(events.iter().any(|event| {
            event.parent_run_id.as_ref() == Some(&result.run_id)
                && event.agent_id.as_str() == "worker"
        }));
        let mut sequences = events
            .iter()
            .map(|event| event.sequence)
            .collect::<Vec<_>>();
        sequences.sort_unstable();
        sequences.dedup();
        assert_eq!(sequences.len(), events.len());
        otherone_storage::localfile::clear_storage_root();
    }
}

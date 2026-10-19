use std::collections::BTreeSet;
use std::fmt;
use std::time::Duration;

use otherone_ai::types::{Message, ProviderType, ToolChoice};
use otherone_storage::types::{AttributeBag, DatabaseConfig, RuntimeContext};
use serde::{Deserialize, Serialize};

use crate::error::AgentError;
use crate::types::{ContextLoadType, StorageType};

fn validate_id(value: &str, kind: &str) -> Result<(), AgentError> {
    if value.is_empty() || value.len() > 64 {
        return Err(AgentError::InvalidConfiguration(format!(
            "{kind} must contain 1-64 characters"
        )));
    }
    let mut chars = value.chars();
    if !chars.next().is_some_and(|ch| ch.is_ascii_lowercase())
        || !chars.all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '_' || ch == '-')
    {
        return Err(AgentError::InvalidConfiguration(format!(
            "invalid {kind} '{value}': expected [a-z][a-z0-9_-]{{0,63}}"
        )));
    }
    Ok(())
}

macro_rules! id_type {
    ($name:ident, $kind:literal) => {
        #[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
        #[serde(transparent)]
        pub struct $name(String);

        impl $name {
            pub fn new(value: impl Into<String>) -> Result<Self, AgentError> {
                let value = value.into();
                validate_id(&value, $kind)?;
                Ok(Self(value))
            }

            pub fn as_str(&self) -> &str {
                &self.0
            }

            pub(crate) fn unchecked(value: impl Into<String>) -> Self {
                Self(value.into())
            }

            pub(crate) fn validate(&self) -> Result<(), AgentError> {
                validate_id(&self.0, $kind)
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
                formatter.write_str(&self.0)
            }
        }

        impl TryFrom<&str> for $name {
            type Error = AgentError;

            fn try_from(value: &str) -> Result<Self, Self::Error> {
                Self::new(value)
            }
        }

        impl TryFrom<String> for $name {
            type Error = AgentError;

            fn try_from(value: String) -> Result<Self, Self::Error> {
                Self::new(value)
            }
        }
    };
}

id_type!(AgentId, "agent id");
id_type!(ModelProfileId, "model profile id");

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct RunId(String);

impl RunId {
    pub fn new() -> Self {
        Self(uuid::Uuid::new_v4().to_string())
    }

    pub fn from_string(value: impl Into<String>) -> Result<Self, AgentError> {
        let value = value.into();
        if value.trim().is_empty() {
            return Err(AgentError::InvalidConfiguration(
                "run id is required".to_string(),
            ));
        }
        Ok(Self(value))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Default for RunId {
    fn default() -> Self {
        Self::new()
    }
}

impl fmt::Display for RunId {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.0)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct AgentCallId(String);

impl AgentCallId {
    pub fn new(value: impl Into<String>) -> Result<Self, AgentError> {
        let value = value.into();
        if value.trim().is_empty() || value.len() > 256 {
            return Err(AgentError::InvalidConfiguration(
                "agent call id must contain 1-256 characters".to_string(),
            ));
        }
        Ok(Self(value))
    }

    pub fn generated() -> Self {
        Self(uuid::Uuid::new_v4().to_string())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for AgentCallId {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.0)
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(bound(serialize = "T: Serialize", deserialize = "T: Ord + Deserialize<'de>"))]
pub enum AccessPolicy<T> {
    #[default]
    None,
    Allow(BTreeSet<T>),
    All,
}

impl<T> AccessPolicy<T>
where
    T: Ord,
{
    pub fn allows(&self, value: &T) -> bool {
        match self {
            Self::None => false,
            Self::Allow(values) => values.contains(value),
            Self::All => true,
        }
    }

    pub fn allowed_values(&self) -> Option<&BTreeSet<T>> {
        match self {
            Self::Allow(values) => Some(values),
            Self::None | Self::All => None,
        }
    }
}

pub type ToolAccessPolicy = AccessPolicy<String>;
pub type SkillAccessPolicy = AccessPolicy<String>;
pub type AgentAccessPolicy = AccessPolicy<AgentId>;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryPolicy {
    #[default]
    Disabled,
    ReadOnlyShared,
    ReadWriteShared,
    PrivateAgent,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ContextTransferPolicy {
    #[default]
    ExplicitOnly,
    ParentSummary {
        max_tokens: u32,
    },
    ParentWindow {
        max_tokens: u32,
    },
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelSelector {
    #[default]
    RuntimeDefault,
    Named(ModelProfileId),
    InheritCaller,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ModelOverrides {
    pub context_length: Option<u32>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub tool_choice: Option<ToolChoice>,
    pub parallel_tool_calls: Option<bool>,
    pub other: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AgentLimits {
    pub max_iterations: Option<u32>,
    pub timeout_millis: Option<u64>,
    pub max_result_bytes: Option<usize>,
}

impl AgentLimits {
    pub fn max_iterations(mut self, value: u32) -> Self {
        self.max_iterations = Some(value);
        self
    }

    pub fn timeout(mut self, value: Duration) -> Self {
        self.timeout_millis = Some(value.as_millis().min(u64::MAX as u128) as u64);
        self
    }

    pub fn max_result_bytes(mut self, value: usize) -> Self {
        self.max_result_bytes = Some(value);
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[non_exhaustive]
pub struct AgentDefinition {
    pub id: AgentId,
    pub version: u64,
    pub description: String,
    pub system_prompt: String,
    pub model: ModelSelector,
    pub model_overrides: ModelOverrides,
    pub tools: ToolAccessPolicy,
    pub skills: SkillAccessPolicy,
    pub callable_agents: AgentAccessPolicy,
    pub memory: MemoryPolicy,
    pub context: ContextTransferPolicy,
    pub limits: AgentLimits,
    pub metadata: AttributeBag,
}

impl AgentDefinition {
    pub fn builder(id: impl Into<String>) -> AgentDefinitionBuilder {
        AgentDefinitionBuilder::new(id)
    }

    pub(crate) fn validate(&self) -> Result<(), AgentError> {
        self.id.validate()?;
        if self.version == 0 {
            return Err(AgentError::InvalidConfiguration(format!(
                "agent '{}' version must be greater than zero",
                self.id
            )));
        }
        let description = self.description.trim();
        if description.is_empty() || description.len() > 1024 {
            return Err(AgentError::InvalidConfiguration(format!(
                "agent '{}' description must contain 1-1024 bytes",
                self.id
            )));
        }
        if self.system_prompt.len() > 128 * 1024 {
            return Err(AgentError::InvalidConfiguration(format!(
                "agent '{}' system prompt is too large",
                self.id
            )));
        }
        if self.limits.max_iterations == Some(0) {
            return Err(AgentError::InvalidConfiguration(format!(
                "agent '{}' max_iterations must be greater than zero",
                self.id
            )));
        }
        if self.limits.timeout_millis == Some(0) || self.limits.max_result_bytes == Some(0) {
            return Err(AgentError::InvalidConfiguration(format!(
                "agent '{}' timeout and result limits must be greater than zero",
                self.id
            )));
        }
        validate_model_values(
            &format!("agent '{}' model overrides", self.id),
            self.model_overrides.context_length,
            self.model_overrides.max_tokens,
            self.model_overrides.temperature,
            self.model_overrides.top_p,
            self.model_overrides.other.as_ref(),
        )?;
        for target in self.callable_agents.allowed_values().into_iter().flatten() {
            target.validate()?;
        }
        Ok(())
    }
}

pub struct AgentDefinitionBuilder {
    definition: AgentDefinition,
}

impl AgentDefinitionBuilder {
    fn new(id: impl Into<String>) -> Self {
        Self {
            definition: AgentDefinition {
                id: AgentId::unchecked(id),
                version: 1,
                description: String::new(),
                system_prompt: String::new(),
                model: ModelSelector::RuntimeDefault,
                model_overrides: ModelOverrides::default(),
                tools: ToolAccessPolicy::None,
                skills: SkillAccessPolicy::None,
                callable_agents: AgentAccessPolicy::None,
                memory: MemoryPolicy::Disabled,
                context: ContextTransferPolicy::ExplicitOnly,
                limits: AgentLimits::default(),
                metadata: AttributeBag::new(),
            },
        }
    }

    pub fn version(mut self, version: u64) -> Self {
        self.definition.version = version;
        self
    }

    pub fn description(mut self, description: impl Into<String>) -> Self {
        self.definition.description = description.into();
        self
    }

    pub fn system_prompt(mut self, system_prompt: impl Into<String>) -> Self {
        self.definition.system_prompt = system_prompt.into();
        self
    }

    pub fn model(mut self, model: ModelSelector) -> Self {
        self.definition.model = model;
        self
    }

    pub fn model_overrides(mut self, overrides: ModelOverrides) -> Self {
        self.definition.model_overrides = overrides;
        self
    }

    pub fn tools(mut self, tools: ToolAccessPolicy) -> Self {
        self.definition.tools = tools;
        self
    }

    pub fn allow_tools<I, S>(mut self, tools: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.definition.tools =
            ToolAccessPolicy::Allow(tools.into_iter().map(Into::into).collect());
        self
    }

    pub fn skills(mut self, skills: SkillAccessPolicy) -> Self {
        self.definition.skills = skills;
        self
    }

    pub fn allow_skills<I, S>(mut self, skills: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.definition.skills =
            SkillAccessPolicy::Allow(skills.into_iter().map(Into::into).collect());
        self
    }

    pub fn callable_agents(mut self, agents: AgentAccessPolicy) -> Self {
        self.definition.callable_agents = agents;
        self
    }

    pub fn allow_agents<I, S>(mut self, agents: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.definition.callable_agents = AgentAccessPolicy::Allow(
            agents
                .into_iter()
                .map(|value| AgentId::unchecked(value))
                .collect(),
        );
        self
    }

    pub fn memory(mut self, memory: MemoryPolicy) -> Self {
        self.definition.memory = memory;
        self
    }

    pub fn context(mut self, context: ContextTransferPolicy) -> Self {
        self.definition.context = context;
        self
    }

    pub fn limits(mut self, limits: AgentLimits) -> Self {
        self.definition.limits = limits;
        self
    }

    pub fn metadata(mut self, metadata: AttributeBag) -> Self {
        self.definition.metadata = metadata;
        self
    }

    pub fn build(self) -> Result<AgentDefinition, AgentError> {
        self.definition.validate()?;
        Ok(self.definition)
    }
}

#[derive(Clone)]
pub struct ModelProfile {
    pub id: ModelProfileId,
    pub provider: ProviderType,
    pub base_url: String,
    pub model: String,
    pub context_length: Option<u32>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub other: Option<serde_json::Value>,
    pub(crate) api_key: String,
}

impl fmt::Debug for ModelProfile {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("ModelProfile")
            .field("id", &self.id)
            .field("provider", &self.provider)
            .field("base_url", &self.base_url)
            .field("model", &self.model)
            .field("api_key", &"[REDACTED]")
            .finish_non_exhaustive()
    }
}

impl ModelProfile {
    pub fn builder(
        id: impl Into<String>,
        provider: ProviderType,
        model: impl Into<String>,
    ) -> ModelProfileBuilder {
        ModelProfileBuilder {
            profile: Self {
                id: ModelProfileId::unchecked(id),
                provider,
                api_key: String::new(),
                base_url: String::new(),
                model: model.into(),
                context_length: None,
                max_tokens: None,
                temperature: None,
                top_p: None,
                other: None,
            },
        }
    }

    pub fn api_key(&self) -> &str {
        &self.api_key
    }

    pub(crate) fn validate(&self) -> Result<(), AgentError> {
        self.id.validate()?;
        if self.api_key.trim().is_empty() {
            return Err(AgentError::InvalidConfiguration(format!(
                "model profile '{}' api_key is required",
                self.id
            )));
        }
        if self.base_url.trim().is_empty() {
            return Err(AgentError::InvalidConfiguration(format!(
                "model profile '{}' base_url is required",
                self.id
            )));
        }
        if self.model.trim().is_empty() {
            return Err(AgentError::InvalidConfiguration(format!(
                "model profile '{}' model is required",
                self.id
            )));
        }
        validate_model_values(
            &format!("model profile '{}'", self.id),
            self.context_length,
            self.max_tokens,
            self.temperature,
            self.top_p,
            self.other.as_ref(),
        )?;
        Ok(())
    }
}

pub struct ModelProfileBuilder {
    profile: ModelProfile,
}

impl ModelProfileBuilder {
    pub fn api_key(mut self, api_key: impl Into<String>) -> Self {
        self.profile.api_key = api_key.into();
        self
    }

    pub fn base_url(mut self, base_url: impl Into<String>) -> Self {
        self.profile.base_url = base_url.into();
        self
    }

    pub fn context_length(mut self, value: u32) -> Self {
        self.profile.context_length = Some(value);
        self
    }

    pub fn max_tokens(mut self, value: u32) -> Self {
        self.profile.max_tokens = Some(value);
        self
    }

    pub fn temperature(mut self, value: f32) -> Self {
        self.profile.temperature = Some(value);
        self
    }

    pub fn top_p(mut self, value: f32) -> Self {
        self.profile.top_p = Some(value);
        self
    }

    pub fn other(mut self, value: serde_json::Value) -> Self {
        self.profile.other = Some(value);
        self
    }

    pub fn build(self) -> Result<ModelProfile, AgentError> {
        self.profile.validate()?;
        Ok(self.profile)
    }
}

#[derive(Debug, Clone)]
pub struct RuntimeLimits {
    pub max_depth: usize,
    pub max_total_runs: usize,
    pub max_children_per_run: usize,
    pub max_concurrent_model_calls: usize,
    pub max_concurrent_tool_calls: usize,
    pub max_iterations_per_run: u32,
    pub max_model_calls: u32,
    pub max_tool_calls: u32,
    pub max_agent_calls: u32,
    pub max_context_transfer_bytes: usize,
    pub max_result_bytes: usize,
    pub run_timeout: Duration,
    pub root_timeout: Duration,
    pub token_budget: Option<u64>,
}

impl RuntimeLimits {
    pub fn safe_defaults() -> Self {
        Self::default()
    }

    pub(crate) fn validate(&self) -> Result<(), AgentError> {
        if self.max_total_runs == 0
            || self.max_concurrent_model_calls == 0
            || self.max_concurrent_tool_calls == 0
            || self.max_iterations_per_run == 0
            || self.max_model_calls == 0
            || self.max_tool_calls == 0
            || self.max_agent_calls == 0
            || self.max_context_transfer_bytes == 0
            || self.max_result_bytes == 0
            || self.run_timeout.is_zero()
            || self.root_timeout.is_zero()
            || self.token_budget == Some(0)
        {
            return Err(AgentError::InvalidConfiguration(
                "runtime limits must be greater than zero".to_string(),
            ));
        }
        Ok(())
    }
}

fn validate_model_values(
    scope: &str,
    context_length: Option<u32>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
    top_p: Option<f32>,
    other: Option<&serde_json::Value>,
) -> Result<(), AgentError> {
    if context_length == Some(0) || max_tokens == Some(0) {
        return Err(AgentError::InvalidConfiguration(format!(
            "{scope} token limits must be greater than zero"
        )));
    }
    if temperature.is_some_and(|value| !value.is_finite()) {
        return Err(AgentError::InvalidConfiguration(format!(
            "{scope} temperature must be finite"
        )));
    }
    if top_p.is_some_and(|value| !value.is_finite() || !(0.0..=1.0).contains(&value)) {
        return Err(AgentError::InvalidConfiguration(format!(
            "{scope} top_p must be between 0 and 1"
        )));
    }
    if other.is_some_and(|value| !value.is_object()) {
        return Err(AgentError::InvalidConfiguration(format!(
            "{scope} other must be a JSON object"
        )));
    }
    Ok(())
}

impl Default for RuntimeLimits {
    fn default() -> Self {
        Self {
            max_depth: 3,
            max_total_runs: 32,
            max_children_per_run: 8,
            max_concurrent_model_calls: 4,
            max_concurrent_tool_calls: 8,
            max_iterations_per_run: 12,
            max_model_calls: 64,
            max_tool_calls: 128,
            max_agent_calls: 32,
            max_context_transfer_bytes: 64 * 1024,
            max_result_bytes: 256 * 1024,
            run_timeout: Duration::from_secs(5 * 60),
            root_timeout: Duration::from_secs(15 * 60),
            token_budget: None,
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct RunLimitOverrides {
    pub max_depth: Option<usize>,
    pub max_total_runs: Option<usize>,
    pub max_iterations_per_run: Option<u32>,
    pub max_result_bytes: Option<usize>,
    pub root_timeout: Option<Duration>,
    pub token_budget: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct SessionTarget {
    pub session_id: Option<String>,
    pub context_load_type: ContextLoadType,
    pub storage_type: StorageType,
    pub database_config: Option<DatabaseConfig>,
    pub context_window: u32,
    pub threshold_percentage: Option<f32>,
}

impl SessionTarget {
    pub fn local() -> Self {
        Self::default()
    }

    pub fn session_id(mut self, session_id: impl Into<String>) -> Self {
        self.session_id = Some(session_id.into());
        self
    }

    pub fn context_window(mut self, context_window: u32) -> Self {
        self.context_window = context_window;
        self
    }

    pub fn threshold_percentage(mut self, threshold_percentage: f32) -> Self {
        self.threshold_percentage = Some(threshold_percentage);
        self
    }

    pub fn database(mut self, database_config: DatabaseConfig) -> Self {
        self.context_load_type = ContextLoadType::Database;
        self.storage_type = StorageType::Database;
        self.database_config = Some(database_config);
        self
    }
}

impl Default for SessionTarget {
    fn default() -> Self {
        Self {
            session_id: None,
            context_load_type: ContextLoadType::LocalFile,
            storage_type: StorageType::LocalFile,
            database_config: None,
            context_window: 8192,
            threshold_percentage: Some(0.8),
        }
    }
}

#[derive(Debug, Clone)]
pub enum AgentInput {
    Text(String),
    Messages(Vec<Message>),
}

impl From<String> for AgentInput {
    fn from(value: String) -> Self {
        Self::Text(value)
    }
}

impl From<&str> for AgentInput {
    fn from(value: &str) -> Self {
        Self::Text(value.to_string())
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum EventVisibility {
    #[default]
    All,
    LifecycleOnly,
    RootOnly,
}

#[derive(Debug, Clone)]
#[non_exhaustive]
pub struct AgentRunRequest {
    pub entry_agent: AgentId,
    pub input: AgentInput,
    pub session: SessionTarget,
    pub runtime_context: Option<RuntimeContext>,
    pub limits: Option<RunLimitOverrides>,
    pub idempotency_key: Option<String>,
    pub event_visibility: EventVisibility,
    pub include_thinking_events: bool,
    pub metadata: AttributeBag,
}

impl AgentRunRequest {
    pub fn new(entry_agent: impl Into<String>, input: impl Into<AgentInput>) -> Self {
        Self {
            entry_agent: AgentId::unchecked(entry_agent),
            input: input.into(),
            session: SessionTarget::default(),
            runtime_context: None,
            limits: None,
            idempotency_key: None,
            event_visibility: EventVisibility::All,
            include_thinking_events: false,
            metadata: AttributeBag::new(),
        }
    }

    pub fn session(mut self, session: SessionTarget) -> Self {
        self.session = session;
        self
    }

    pub fn runtime_context(mut self, runtime_context: RuntimeContext) -> Self {
        self.runtime_context = Some(runtime_context);
        self
    }

    pub fn limits(mut self, limits: RunLimitOverrides) -> Self {
        self.limits = Some(limits);
        self
    }

    pub fn idempotency_key(mut self, idempotency_key: impl Into<String>) -> Self {
        self.idempotency_key = Some(idempotency_key.into());
        self
    }

    pub fn event_visibility(mut self, visibility: EventVisibility) -> Self {
        self.event_visibility = visibility;
        self
    }

    pub fn include_thinking_events(mut self, include: bool) -> Self {
        self.include_thinking_events = include;
        self
    }

    pub fn metadata(mut self, metadata: AttributeBag) -> Self {
        self.metadata = metadata;
        self
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ResultContract {
    Text,
    Json {
        schema: Option<serde_json::Value>,
    },
    #[default]
    Auto,
}

#[derive(Debug, Clone)]
#[non_exhaustive]
pub struct AgentCallRequest {
    pub target: AgentId,
    pub task: String,
    pub context: Option<serde_json::Value>,
    pub result_contract: ResultContract,
    pub max_iterations: Option<u32>,
    pub timeout: Option<Duration>,
    pub metadata: AttributeBag,
}

#[derive(Debug, Clone)]
pub struct AgentRunContextView {
    pub run_id: RunId,
    pub root_run_id: RunId,
    pub parent_run_id: Option<RunId>,
    pub agent_id: AgentId,
    pub session_id: String,
    pub depth: usize,
    pub ancestry: Vec<AgentId>,
    pub runtime_context: Option<RuntimeContext>,
}

impl AgentCallRequest {
    pub fn new(target: impl Into<String>, task: impl Into<String>) -> Self {
        Self {
            target: AgentId::unchecked(target),
            task: task.into(),
            context: None,
            result_contract: ResultContract::Auto,
            max_iterations: None,
            timeout: None,
            metadata: AttributeBag::new(),
        }
    }

    pub fn context(mut self, context: serde_json::Value) -> Self {
        self.context = Some(context);
        self
    }

    pub fn result_contract(mut self, result_contract: ResultContract) -> Self {
        self.result_contract = result_contract;
        self
    }

    pub fn max_iterations(mut self, max_iterations: u32) -> Self {
        self.max_iterations = Some(max_iterations);
        self
    }

    pub fn timeout(mut self, timeout: Duration) -> Self {
        self.timeout = Some(timeout);
        self
    }

    pub fn metadata(mut self, metadata: AttributeBag) -> Self {
        self.metadata = metadata;
        self
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct RunUsage {
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
    pub total_tokens: Option<u64>,
    pub model_calls: u32,
    pub tool_calls: u32,
    pub agent_calls: u32,
    pub duration_millis: u64,
}

impl RunUsage {
    pub fn add_assign(&mut self, other: &RunUsage) {
        self.input_tokens = add_options(self.input_tokens, other.input_tokens);
        self.output_tokens = add_options(self.output_tokens, other.output_tokens);
        self.total_tokens = add_options(self.total_tokens, other.total_tokens);
        self.model_calls = self.model_calls.saturating_add(other.model_calls);
        self.tool_calls = self.tool_calls.saturating_add(other.tool_calls);
        self.agent_calls = self.agent_calls.saturating_add(other.agent_calls);
        self.duration_millis = self.duration_millis.saturating_add(other.duration_millis);
    }
}

fn add_options(left: Option<u64>, right: Option<u64>) -> Option<u64> {
    match (left, right) {
        (Some(left), Some(right)) => Some(left.saturating_add(right)),
        (Some(value), None) | (None, Some(value)) => Some(value),
        (None, None) => None,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "value", rename_all = "snake_case")]
pub enum AgentOutput {
    Text(String),
    Json(serde_json::Value),
}

impl AgentOutput {
    pub fn byte_len(&self) -> usize {
        match self {
            Self::Text(value) => value.len(),
            Self::Json(value) => serde_json::to_vec(value)
                .map(|value| value.len())
                .unwrap_or(0),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AgentFailure {
    pub code: String,
    pub message: String,
    pub retryable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum RunOutcome {
    Completed,
    Failed(AgentFailure),
    Cancelled,
    TimedOut,
    BudgetExceeded,
    HandedOff { successor_run_id: RunId },
}

impl RunOutcome {
    pub fn kind(&self) -> RunOutcomeKind {
        match self {
            Self::Completed => RunOutcomeKind::Completed,
            Self::Failed(_) => RunOutcomeKind::Failed,
            Self::Cancelled => RunOutcomeKind::Cancelled,
            Self::TimedOut => RunOutcomeKind::TimedOut,
            Self::BudgetExceeded => RunOutcomeKind::BudgetExceeded,
            Self::HandedOff { .. } => RunOutcomeKind::HandedOff,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RunOutcomeKind {
    Completed,
    Failed,
    Cancelled,
    TimedOut,
    BudgetExceeded,
    HandedOff,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ArtifactRef {
    pub artifact_id: String,
    pub media_type: Option<String>,
    pub name: Option<String>,
    pub size_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AgentRunResult {
    pub run_id: RunId,
    pub root_run_id: RunId,
    pub agent_id: AgentId,
    pub session_id: String,
    pub outcome: RunOutcome,
    pub output: Option<AgentOutput>,
    pub usage: RunUsage,
    pub artifacts: Vec<ArtifactRef>,
    pub metadata: AttributeBag,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AgentCallResult {
    pub schema_version: u16,
    pub call_id: AgentCallId,
    pub target: AgentId,
    pub run_id: Option<RunId>,
    pub outcome: RunOutcome,
    pub output: Option<AgentOutput>,
    pub usage: RunUsage,
    pub artifacts: Vec<ArtifactRef>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RunStatus {
    Created,
    Queued,
    Running,
    WaitingForChild,
    Completed,
    Failed,
    Cancelled,
    TimedOut,
    BudgetExceeded,
    HandedOff,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunRecord {
    pub run_id: RunId,
    pub root_run_id: RunId,
    pub parent_run_id: Option<RunId>,
    pub agent_call_id: Option<AgentCallId>,
    pub agent_id: AgentId,
    pub agent_definition_version: u64,
    pub session_id: String,
    pub status: RunStatus,
    pub depth: usize,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub usage: RunUsage,
    pub failure: Option<AgentFailure>,
    pub metadata: AttributeBag,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentEventEnvelope {
    pub schema_version: u16,
    pub event_id: String,
    pub sequence: u64,
    pub timestamp: String,
    pub root_run_id: RunId,
    pub run_id: RunId,
    pub parent_run_id: Option<RunId>,
    pub agent_id: AgentId,
    pub depth: usize,
    pub event: AgentEvent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum AgentEvent {
    RunStarted,
    ModelStarted,
    ModelDelta {
        content: String,
    },
    ThinkingDelta {
        content: String,
    },
    ModelCompleted {
        usage: RunUsage,
    },
    ToolStarted {
        tool_call_id: String,
        tool_name: String,
    },
    ToolCompleted {
        tool_call_id: String,
        tool_name: String,
        error: Option<String>,
    },
    AgentCallStarted {
        call_id: AgentCallId,
        target: AgentId,
    },
    AgentCallCompleted {
        call_id: AgentCallId,
        target: AgentId,
        outcome: RunOutcomeKind,
    },
    UserMessageQueued {
        count: usize,
    },
    RunCompleted,
    RunFailed {
        failure: AgentFailure,
    },
    RunCancelled,
}

impl AgentEvent {
    pub fn is_lifecycle(&self) -> bool {
        matches!(
            self,
            Self::RunStarted
                | Self::AgentCallStarted { .. }
                | Self::AgentCallCompleted { .. }
                | Self::RunCompleted
                | Self::RunFailed { .. }
                | Self::RunCancelled
        )
    }
}

#[derive(Debug, Clone)]
pub enum AgentRunCommand {
    EnqueueUserMessages(Vec<String>),
    Cancel,
}

#[derive(Debug, Clone)]
pub(crate) struct EffectiveLimits {
    pub runtime: RuntimeLimits,
}

impl EffectiveLimits {
    pub fn from_request(defaults: &RuntimeLimits, overrides: Option<&RunLimitOverrides>) -> Self {
        let mut runtime = defaults.clone();
        if let Some(overrides) = overrides {
            if let Some(value) = overrides.max_depth {
                runtime.max_depth = runtime.max_depth.min(value);
            }
            if let Some(value) = overrides.max_total_runs {
                runtime.max_total_runs = runtime.max_total_runs.min(value);
            }
            if let Some(value) = overrides.max_iterations_per_run {
                runtime.max_iterations_per_run = runtime.max_iterations_per_run.min(value);
            }
            if let Some(value) = overrides.max_result_bytes {
                runtime.max_result_bytes = runtime.max_result_bytes.min(value);
            }
            if let Some(value) = overrides.root_timeout {
                runtime.root_timeout = runtime.root_timeout.min(value);
            }
            if let Some(value) = overrides.token_budget {
                runtime.token_budget = Some(
                    runtime
                        .token_budget
                        .map(|current| current.min(value))
                        .unwrap_or(value),
                );
            }
        }
        Self { runtime }
    }
}

pub(crate) fn metadata_with_lineage(
    base: &AttributeBag,
    root_run_id: &RunId,
    parent_run_id: Option<&RunId>,
    agent_call_id: Option<&AgentCallId>,
    agent_id: &AgentId,
    depth: usize,
) -> AttributeBag {
    let mut metadata = base.clone();
    metadata.insert("root_run_id".to_string(), serde_json::json!(root_run_id));
    if let Some(parent_run_id) = parent_run_id {
        metadata.insert(
            "parent_run_id".to_string(),
            serde_json::json!(parent_run_id),
        );
    }
    if let Some(agent_call_id) = agent_call_id {
        metadata.insert(
            "agent_call_id".to_string(),
            serde_json::json!(agent_call_id),
        );
    }
    metadata.insert("agent_id".to_string(), serde_json::json!(agent_id));
    metadata.insert("depth".to_string(), serde_json::json!(depth));
    if depth > 0 {
        metadata.insert(
            "session_kind".to_string(),
            serde_json::json!("agent_internal"),
        );
    }
    metadata
}

pub(crate) fn merge_other(
    base: Option<&serde_json::Value>,
    overrides: Option<&serde_json::Value>,
) -> Option<serde_json::Value> {
    match (base, overrides) {
        (None, None) => None,
        (Some(value), None) | (None, Some(value)) => Some(value.clone()),
        (Some(serde_json::Value::Object(base)), Some(serde_json::Value::Object(overrides))) => {
            let mut merged = base.clone();
            for (key, value) in overrides {
                merged.insert(key.clone(), value.clone());
            }
            Some(serde_json::Value::Object(merged))
        }
        (_, Some(value)) => Some(value.clone()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_agent_ids() {
        assert!(AgentId::new("researcher").is_ok());
        assert!(AgentId::new("code-reviewer_2").is_ok());
        assert!(AgentId::new("Researcher").is_err());
        assert!(AgentId::new("2researcher").is_err());
    }

    #[test]
    fn request_limits_only_tighten_defaults() {
        let defaults = RuntimeLimits::default();
        let effective = EffectiveLimits::from_request(
            &defaults,
            Some(&RunLimitOverrides {
                max_depth: Some(defaults.max_depth + 10),
                max_total_runs: Some(2),
                ..Default::default()
            }),
        );
        assert_eq!(effective.runtime.max_depth, defaults.max_depth);
        assert_eq!(effective.runtime.max_total_runs, 2);
    }

    #[test]
    fn model_profile_debug_redacts_api_key() {
        let profile = ModelProfile::builder("default", ProviderType::OpenAI, "model")
            .api_key("secret")
            .base_url("http://localhost")
            .build()
            .unwrap();
        let debug = format!("{profile:?}");
        assert!(!debug.contains("secret"));
        assert!(debug.contains("REDACTED"));
    }
}

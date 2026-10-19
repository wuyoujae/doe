use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Instant;

use tokio::sync::{mpsc, RwLock, Semaphore};
use tokio_util::sync::CancellationToken;

use crate::error::AgentError;

use super::event::EventBus;
use super::registry::RuntimeSnapshot;
use super::types::{
    AgentCallId, AgentDefinition, AgentId, AgentRunCommand, EffectiveLimits, ModelProfile,
    ResultContract, RunId, RunRecord, RunStatus, RunUsage, SessionTarget,
};

#[derive(Debug, Default)]
struct BudgetState {
    total_runs: usize,
    model_calls: u32,
    tool_calls: u32,
    agent_calls: u32,
    total_tokens: u64,
    output_bytes: usize,
}

/// 一个根任务共享的原子预算账本。
pub struct BudgetLedger {
    limits: EffectiveLimits,
    state: Mutex<BudgetState>,
}

impl BudgetLedger {
    pub(crate) fn new(limits: EffectiveLimits) -> Self {
        Self {
            limits,
            state: Mutex::new(BudgetState::default()),
        }
    }

    pub(crate) fn limits(&self) -> &EffectiveLimits {
        &self.limits
    }

    pub(crate) fn reserve_run(&self) -> Result<(), AgentError> {
        let mut state = self.lock_state()?;
        if state.total_runs >= self.limits.runtime.max_total_runs {
            return Err(AgentError::BudgetExceeded("max_total_runs".to_string()));
        }
        state.total_runs += 1;
        Ok(())
    }

    pub(crate) fn reserve_model_call(&self) -> Result<(), AgentError> {
        let mut state = self.lock_state()?;
        if state.model_calls >= self.limits.runtime.max_model_calls {
            return Err(AgentError::BudgetExceeded("max_model_calls".to_string()));
        }
        state.model_calls += 1;
        Ok(())
    }

    pub(crate) fn reserve_tool_call(&self) -> Result<(), AgentError> {
        let mut state = self.lock_state()?;
        if state.tool_calls >= self.limits.runtime.max_tool_calls {
            return Err(AgentError::BudgetExceeded("max_tool_calls".to_string()));
        }
        state.tool_calls += 1;
        Ok(())
    }

    pub(crate) fn reserve_agent_call(&self) -> Result<(), AgentError> {
        let mut state = self.lock_state()?;
        if state.agent_calls >= self.limits.runtime.max_agent_calls {
            return Err(AgentError::BudgetExceeded("max_agent_calls".to_string()));
        }
        state.agent_calls += 1;
        Ok(())
    }

    pub(crate) fn add_tokens(&self, tokens: u64) -> Result<(), AgentError> {
        let mut state = self.lock_state()?;
        state.total_tokens = state.total_tokens.saturating_add(tokens);
        if self
            .limits
            .runtime
            .token_budget
            .is_some_and(|limit| state.total_tokens > limit)
        {
            return Err(AgentError::BudgetExceeded("token_budget".to_string()));
        }
        Ok(())
    }

    pub(crate) fn add_output_bytes(&self, bytes: usize) -> Result<(), AgentError> {
        let mut state = self.lock_state()?;
        state.output_bytes = state.output_bytes.saturating_add(bytes);
        if state.output_bytes > self.limits.runtime.max_result_bytes {
            return Err(AgentError::BudgetExceeded("max_result_bytes".to_string()));
        }
        Ok(())
    }

    fn lock_state(&self) -> Result<std::sync::MutexGuard<'_, BudgetState>, AgentError> {
        self.state
            .lock()
            .map_err(|_| AgentError::Internal("budget ledger lock poisoned".to_string()))
    }
}

#[derive(Clone, Default)]
pub struct InMemoryRunStore {
    records: Arc<RwLock<HashMap<RunId, RunRecord>>>,
}

impl InMemoryRunStore {
    pub async fn create(&self, record: RunRecord) -> Result<(), AgentError> {
        let mut records = self.records.write().await;
        if records.contains_key(&record.run_id) {
            return Err(AgentError::Internal(format!(
                "run '{}' already exists",
                record.run_id
            )));
        }
        records.insert(record.run_id.clone(), record);
        Ok(())
    }

    pub async fn update_status(&self, run_id: &RunId, status: RunStatus) -> Result<(), AgentError> {
        let mut records = self.records.write().await;
        let record = records
            .get_mut(run_id)
            .ok_or_else(|| AgentError::Internal(format!("run '{run_id}' not found")))?;
        record.status = status;
        Ok(())
    }

    pub async fn finish(
        &self,
        run_id: &RunId,
        status: RunStatus,
        usage: RunUsage,
        failure: Option<super::types::AgentFailure>,
    ) -> Result<(), AgentError> {
        let mut records = self.records.write().await;
        let record = records
            .get_mut(run_id)
            .ok_or_else(|| AgentError::Internal(format!("run '{run_id}' not found")))?;
        record.status = status;
        record.usage = usage;
        record.failure = failure;
        record.finished_at = Some(chrono::Utc::now().to_rfc3339());
        Ok(())
    }

    pub async fn get(&self, run_id: &RunId) -> Option<RunRecord> {
        self.records.read().await.get(run_id).cloned()
    }

    pub async fn list_root(&self, root_run_id: &RunId) -> Vec<RunRecord> {
        let mut records = self
            .records
            .read()
            .await
            .values()
            .filter(|record| &record.root_run_id == root_run_id)
            .cloned()
            .collect::<Vec<_>>();
        records.sort_by(|left, right| left.started_at.cmp(&right.started_at));
        records
    }
}

#[derive(Clone)]
pub(crate) struct RunContext {
    pub run_id: RunId,
    pub root_run_id: RunId,
    pub parent_run_id: Option<RunId>,
    pub agent_call_id: Option<AgentCallId>,
    pub agent: Arc<AgentDefinition>,
    pub model: Arc<ModelProfile>,
    pub session_id: String,
    pub parent_session_id: Option<String>,
    pub session: SessionTarget,
    pub runtime_context: Option<otherone_storage::types::RuntimeContext>,
    pub depth: usize,
    pub ancestry: Vec<AgentId>,
    pub deadline: Instant,
    pub max_iterations_override: Option<u32>,
    pub result_contract: Option<ResultContract>,
    pub cancellation: CancellationToken,
    pub budget: Arc<BudgetLedger>,
    pub snapshot: Arc<RuntimeSnapshot>,
    pub events: EventBus,
    pub child_count: Arc<AtomicUsize>,
    pub active_children: Arc<AtomicUsize>,
    pub usage: Arc<Mutex<RunUsage>>,
    pub metadata: otherone_storage::types::AttributeBag,
}

impl RunContext {
    pub fn reserve_child(&self) -> Result<(), AgentError> {
        let previous = self.child_count.fetch_add(1, Ordering::SeqCst);
        if previous >= self.budget.limits().runtime.max_children_per_run {
            self.child_count.fetch_sub(1, Ordering::SeqCst);
            return Err(AgentError::BudgetExceeded(
                "max_children_per_run".to_string(),
            ));
        }
        Ok(())
    }

    pub fn view(&self) -> super::types::AgentRunContextView {
        super::types::AgentRunContextView {
            run_id: self.run_id.clone(),
            root_run_id: self.root_run_id.clone(),
            parent_run_id: self.parent_run_id.clone(),
            agent_id: self.agent.id.clone(),
            session_id: self.session_id.clone(),
            depth: self.depth,
            ancestry: self.ancestry.clone(),
            runtime_context: self.runtime_context.clone(),
        }
    }

    pub fn record_usage(&self, usage: &RunUsage) {
        if let Ok(mut current) = self.usage.lock() {
            *current = usage.clone();
        }
    }

    pub fn usage_snapshot(&self) -> RunUsage {
        self.usage
            .lock()
            .map(|usage| usage.clone())
            .unwrap_or_default()
    }
}

#[derive(Clone)]
pub(crate) struct ActiveRun {
    pub context: RunContext,
    pub commands: mpsc::Sender<AgentRunCommand>,
}

pub(crate) struct RunSupervisor {
    pub run_store: InMemoryRunStore,
    pub model_semaphore: Arc<Semaphore>,
    pub tool_semaphore: Arc<Semaphore>,
    active_runs: RwLock<HashMap<RunId, ActiveRun>>,
    session_writers: Arc<Mutex<HashSet<String>>>,
}

impl RunSupervisor {
    pub fn new(limits: &super::types::RuntimeLimits) -> Self {
        Self {
            run_store: InMemoryRunStore::default(),
            model_semaphore: Arc::new(Semaphore::new(limits.max_concurrent_model_calls)),
            tool_semaphore: Arc::new(Semaphore::new(limits.max_concurrent_tool_calls)),
            active_runs: RwLock::new(HashMap::new()),
            session_writers: global_session_writers(),
        }
    }

    pub async fn register(
        &self,
        context: RunContext,
        commands: mpsc::Sender<AgentRunCommand>,
    ) -> Result<SessionLease, AgentError> {
        let lease = SessionLease::acquire(
            Arc::clone(&self.session_writers),
            session_key(&context),
            context.session_id.clone(),
        )?;
        self.active_runs
            .write()
            .await
            .insert(context.run_id.clone(), ActiveRun { context, commands });
        Ok(lease)
    }

    pub async fn unregister(&self, run_id: &RunId) {
        self.active_runs.write().await.remove(run_id);
    }

    pub async fn active(&self, run_id: &RunId) -> Option<ActiveRun> {
        self.active_runs.read().await.get(run_id).cloned()
    }

    pub async fn cancel(&self, run_id: &RunId) -> Result<(), AgentError> {
        let active = self.active(run_id).await.ok_or_else(|| {
            AgentError::InvalidConfiguration(format!("run '{run_id}' is not active"))
        })?;
        active.context.cancellation.cancel();
        Ok(())
    }

    pub async fn send_message(
        &self,
        run_id: &RunId,
        messages: Vec<String>,
    ) -> Result<(), AgentError> {
        let active = self.active(run_id).await.ok_or_else(|| {
            AgentError::InvalidConfiguration(format!("run '{run_id}' is not active"))
        })?;
        active
            .commands
            .send(AgentRunCommand::EnqueueUserMessages(messages))
            .await
            .map_err(|_| AgentError::InvalidConfiguration(format!("run '{run_id}' is closed")))
    }
}

fn session_key(context: &RunContext) -> String {
    let partition = context
        .runtime_context
        .as_ref()
        .map(|context| context.partition_key.as_str())
        .unwrap_or("local");
    match context.session.storage_type {
        crate::types::StorageType::LocalFile => format!(
            "local:{}:{partition}:{}",
            otherone_storage::localfile::get_storage_path().display(),
            context.session_id
        ),
        crate::types::StorageType::Database => {
            let database = context
                .session
                .database_config
                .as_ref()
                .map(|config| format!("{}:{}/{}", config.host, config.port, config.database))
                .unwrap_or_else(|| "database".to_string());
            format!("database:{database}:{partition}:{}", context.session_id)
        }
    }
}

fn global_session_writers() -> Arc<Mutex<HashSet<String>>> {
    static WRITERS: OnceLock<Arc<Mutex<HashSet<String>>>> = OnceLock::new();
    Arc::clone(WRITERS.get_or_init(|| Arc::new(Mutex::new(HashSet::new()))))
}

pub(crate) struct SessionLease {
    writers: Arc<Mutex<HashSet<String>>>,
    key: String,
}

impl SessionLease {
    fn acquire(
        writers: Arc<Mutex<HashSet<String>>>,
        key: String,
        session_id: String,
    ) -> Result<Self, AgentError> {
        {
            let mut active = writers
                .lock()
                .map_err(|_| AgentError::Internal("session lock poisoned".to_string()))?;
            if !active.insert(key.clone()) {
                return Err(AgentError::SessionBusy(session_id));
            }
        }
        Ok(Self { writers, key })
    }
}

impl Drop for SessionLease {
    fn drop(&mut self) {
        if let Ok(mut writers) = self.writers.lock() {
            writers.remove(&self.key);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn budget_enforces_total_runs() {
        let limits = super::super::types::RuntimeLimits {
            max_total_runs: 1,
            ..Default::default()
        };
        let ledger = BudgetLedger::new(EffectiveLimits { runtime: limits });
        assert!(ledger.reserve_run().is_ok());
        assert!(matches!(
            ledger.reserve_run(),
            Err(AgentError::BudgetExceeded(_))
        ));
    }
}

use otherone_ai::types::Message;
use otherone_storage::types::{AttributeBag, DatabaseConfig, RuntimeContext};
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ContextLoadType {
    Database,
    LocalFile,
}

type MessageTransform =
    dyn Fn(Vec<Message>) -> Result<Vec<Message>, String> + Send + Sync + 'static;

/// Transforms only the historical prefix selected for LLM compaction.
///
/// The retained suffix is never passed to this hook. Metadata is attached to
/// the resulting compacted entry so callers can invalidate summaries produced
/// before a privacy filter was introduced without repeatedly deleting safe
/// summaries.
#[derive(Clone)]
pub struct PreCompactionMessageHook {
    transform: Arc<MessageTransform>,
    compacted_entry_metadata: AttributeBag,
}

impl PreCompactionMessageHook {
    pub fn new<F>(transform: F) -> Self
    where
        F: Fn(Vec<Message>) -> Result<Vec<Message>, String> + Send + Sync + 'static,
    {
        Self {
            transform: Arc::new(transform),
            compacted_entry_metadata: AttributeBag::new(),
        }
    }

    pub fn with_compacted_entry_metadata(mut self, metadata: AttributeBag) -> Self {
        self.compacted_entry_metadata = metadata;
        self
    }

    pub(crate) fn transform(&self, messages: Vec<Message>) -> Result<Vec<Message>, String> {
        (self.transform)(messages)
    }

    pub(crate) fn compacted_entry_metadata(&self) -> &AttributeBag {
        &self.compacted_entry_metadata
    }
}

#[derive(Debug, Clone)]
pub struct CombineContextOptions {
    pub session_id: String,
    pub load_type: ContextLoadType,
    pub provider: otherone_ai::types::ProviderType,
    pub context_window: u32,
    pub threshold_percentage: Option<f32>,
    pub ai: Option<serde_json::Value>,
    pub compact_executor: Option<Arc<dyn otherone_ai::traits::ModelExecutor>>,
    pub system_prompt: Option<String>,
    pub tools: Option<Vec<otherone_ai::types::Tool>>,
    pub database_config: Option<DatabaseConfig>,
    pub runtime_context: Option<RuntimeContext>,
}

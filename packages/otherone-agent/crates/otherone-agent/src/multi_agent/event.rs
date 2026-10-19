use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

use tokio::sync::mpsc;

use super::types::{AgentEvent, AgentEventEnvelope, AgentId, EventVisibility, RunId};

#[derive(Clone)]
pub(crate) struct EventBus {
    sender: mpsc::Sender<AgentEventEnvelope>,
    sequence: Arc<AtomicU64>,
    visibility: EventVisibility,
    include_thinking: bool,
}

impl EventBus {
    pub fn new(
        sender: mpsc::Sender<AgentEventEnvelope>,
        visibility: EventVisibility,
        include_thinking: bool,
    ) -> Self {
        Self {
            sender,
            sequence: Arc::new(AtomicU64::new(0)),
            visibility,
            include_thinking,
        }
    }

    pub fn emit(
        &self,
        root_run_id: &RunId,
        run_id: &RunId,
        parent_run_id: Option<&RunId>,
        agent_id: &AgentId,
        depth: usize,
        event: AgentEvent,
    ) {
        if matches!(event, AgentEvent::ThinkingDelta { .. }) && !self.include_thinking {
            return;
        }
        if depth > 0 {
            match self.visibility {
                EventVisibility::RootOnly => return,
                EventVisibility::LifecycleOnly if !event.is_lifecycle() => return,
                EventVisibility::All | EventVisibility::LifecycleOnly => {}
            }
        }

        let envelope = AgentEventEnvelope {
            schema_version: 1,
            event_id: uuid::Uuid::new_v4().to_string(),
            sequence: self.sequence.fetch_add(1, Ordering::SeqCst),
            timestamp: chrono::Utc::now().to_rfc3339(),
            root_run_id: root_run_id.clone(),
            run_id: run_id.clone(),
            parent_run_id: parent_run_id.cloned(),
            agent_id: agent_id.clone(),
            depth,
            event,
        };

        // 事件是观察通道，不能阻塞 Agent 执行或最终结果通道。
        let _ = self.sender.try_send(envelope);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn thinking_events_require_explicit_opt_in() {
        let (sender, mut receiver) = mpsc::channel(4);
        let bus = EventBus::new(sender, EventVisibility::All, false);
        let run_id = RunId::new();
        let agent_id = AgentId::new("agent").unwrap();
        bus.emit(
            &run_id,
            &run_id,
            None,
            &agent_id,
            0,
            AgentEvent::ThinkingDelta {
                content: "private reasoning".to_string(),
            },
        );
        bus.emit(
            &run_id,
            &run_id,
            None,
            &agent_id,
            0,
            AgentEvent::ModelDelta {
                content: "visible".to_string(),
            },
        );

        let event = receiver.recv().await.unwrap();
        assert!(matches!(event.event, AgentEvent::ModelDelta { .. }));
        assert!(receiver.try_recv().is_err());
    }
}

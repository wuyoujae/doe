//! Runtime-scoped Otherone storage backed by the existing fenced SQLite run checkpoint.
use crate::projects;
use otherone::storage::types::{
    Entry, SessionData, SessionStore, StoreFuture, WriteCompactedEntryOptions, WriteEntryOptions,
};
use serde_json::{Value, json};
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};
use tokio::sync::Mutex;

#[derive(Clone)]
pub(super) struct History {
    repository: Arc<projects::Repository>,
    run: String,
    messages: Arc<Mutex<Vec<Value>>>,
    pub terminal: Arc<AtomicBool>,
}

impl std::fmt::Debug for History {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("SqliteAgentHistory")
    }
}

impl History {
    pub fn new(
        repository: Arc<projects::Repository>,
        run: String,
        messages: Vec<Value>,
    ) -> Arc<Self> {
        Arc::new(Self {
            repository,
            run,
            messages: Arc::new(Mutex::new(messages)),
            terminal: Arc::new(AtomicBool::new(false)),
        })
    }
    pub async fn snapshot(&self) -> Vec<Value> {
        self.messages.lock().await.clone()
    }
    async fn persist(&self, messages: Vec<Value>) -> Result<(), String> {
        if self.terminal.load(Ordering::Acquire) {
            return Ok(());
        }
        let (repository, run) = (self.repository.clone(), self.run.clone());
        tokio::task::spawn_blocking(move || repository.checkpoint(&run, &json!(messages)))
            .await
            .map_err(|_| "agent_history_task_failed".to_string())?
            .map_err(|_| "agent_history_write_rejected".to_string())
    }
}

impl SessionStore for History {
    fn read(&self, session_id: String) -> StoreFuture<SessionData> {
        let history = self.clone();
        Box::pin(async move {
            if session_id != history.run {
                return Err("agent_history_session_mismatch".into());
            }
            let messages = history.snapshot().await;
            let entries = messages.iter().enumerate().map(|(index, message)| {
                let mut metadata = std::collections::BTreeMap::new();
                if let Some(reasoning) = message.get("reasoning_content") { metadata.insert("otherone_reasoning_content".into(), reasoning.clone()); }
                if let Some(name) = message.get("name") { metadata.insert("otherone_message_name".into(), name.clone()); }
                if message["content"].is_array() { metadata.insert("otherone_message_content".into(), message["content"].clone()); }
                Entry {
                    partition_key: None, entry_id: index.to_string(), session_id: session_id.clone(),
                    content: message["content"].as_str().unwrap_or("").into(),
                    role: message["role"].as_str().unwrap_or("user").into(),
                    token_consumption: None, status: 0,
                    tools: if message["role"] == "assistant" { message.get("tool_calls").map(|calls| json!({"tool_calls":calls})) }
                        else if message["role"] == "tool" { Some(json!({"tool_call_id":message["tool_call_id"],"function_name":message.get("name")})) } else { None },
                    create_at: format!("{index:020}"), is_compaction: 1, attributes: Default::default(), metadata,
                }
            }).collect();
            Ok(SessionData {
                session: None,
                entries,
                compacted_entries: Vec::new(),
            })
        })
    }

    fn append(&self, options: WriteEntryOptions) -> StoreFuture<()> {
        let history = self.clone();
        Box::pin(async move {
            if options.session_id != history.run {
                return Err("agent_history_session_mismatch".into());
            }
            let mut message = json!({"role":options.role,"content":options.content});
            if options.role == "assistant" {
                if let Some(calls) = options
                    .tools
                    .as_ref()
                    .and_then(|tools| tools.get("tool_calls"))
                {
                    message["tool_calls"] = calls.clone();
                }
                if let Some(reasoning) = options.metadata.get("otherone_reasoning_content") {
                    message["reasoning_content"] = reasoning.clone();
                }
            } else if options.role == "tool" {
                let tools = options.tools.as_ref().ok_or("agent_tool_receipt_missing")?;
                let mut result = tools["result"].clone();
                if result.is_null() {
                    result = json!({"status":"failed","error":tools["error"]});
                }
                message["tool_call_id"] = tools["tool_call_id"].clone();
                message["name"] = tools["function_name"].clone();
                message["content"] = json!(match result.as_str() {
                    Some(text) => text.to_owned(),
                    None => result.to_string(),
                });
                if tools["error"].is_string() {
                    let (repository, run) = (history.repository.clone(), history.run.clone());
                    let payload = json!({"messageId":run,"itemId":tools["tool_call_id"],"callId":tools["tool_call_id"],"name":tools["function_name"],"result":{"status":"failed","committed":false,"error":tools["error"]},"status":"failed"});
                    tokio::task::spawn_blocking(move || {
                        repository.append_run_event(&run, "tool_result", &payload)
                    })
                    .await
                    .map_err(|_| "agent_tool_event_failed")?
                    .map_err(|_| "agent_tool_event_write_rejected")?;
                }
            }
            let mut messages = history.messages.lock().await;
            messages.push(message);
            history.persist(messages.clone()).await
        })
    }

    fn compact(&self, options: WriteCompactedEntryOptions) -> StoreFuture<()> {
        let history = self.clone();
        Box::pin(async move {
            if options.session_id != history.run {
                return Err("agent_history_session_mismatch".into());
            }
            let cutoff = options
                .trigger_entry_id
                .parse::<usize>()
                .map_err(|_| "agent_compaction_boundary_invalid")?;
            let mut messages = history.messages.lock().await;
            if cutoff >= messages.len() {
                return Err("agent_compaction_boundary_invalid".into());
            }
            let suffix = messages.split_off(cutoff + 1);
            // Keep human statements verbatim as well as the SDK's summary and retained tool suffix.
            // Their durable display log is independent and is never compacted.
            let selected = super::context::selected_skill_ids(&messages);
            let users = messages
                .iter()
                .filter(|message| {
                    message["role"] == "user"
                        && !matches!(
                            message["name"].as_str(),
                            Some("yrkie_context_summary" | "yrkie_selected_skills")
                        )
                })
                .cloned()
                .collect::<Vec<_>>();
            *messages = vec![
                json!({"role":"user","name":"yrkie_context_summary","content":options.summary}),
            ];
            messages.extend(users);
            if !selected.is_empty() {
                messages.push(json!({"role":"user","name":"yrkie_selected_skills","content":format!("Host selected Skill ids: {}", json!(selected))}));
            }
            messages.extend(suffix);
            history.persist(messages.clone()).await
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use otherone::storage::types::{RuntimeContext, StorageType};

    fn setup(messages: Vec<Value>) -> Arc<History> {
        let directory = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../test/20261019-original-core/agent-history")
            .join(uuid::Uuid::new_v4().to_string());
        let repository = Arc::new(projects::Repository::open(&directory).unwrap());
        let run = repository
            .create(projects::CreateProject {
                prompt: "A storage boundary fixture".into(),
                request_id: "history-fixture".into(),
                upload_ids: Vec::new(),
            })
            .unwrap()
            .launch
            .unwrap();
        repository.claim(&run.run_id).unwrap();
        History::new(repository, run.run_id, messages)
    }

    #[tokio::test]
    async fn sdk_storage_dispatch_uses_sqlite_and_preserves_exact_reasoning_and_object_receipts() {
        let history = setup(vec![
            json!({"role":"user","content":"Keep figure 37 exactly."}),
        ]);
        let runtime = RuntimeContext::new("fixture").with_session_store(history.clone());
        otherone::storage::write_entry(&WriteEntryOptions {
            storage_type: StorageType::LocalFile, session_id: history.run.clone(), role: "assistant".into(), content: String::new(),
            tools: Some(json!({"tool_calls":[{"id":"read-1","type":"function","function":{"name":"ReadOutline","arguments":"{}"}}]})), token_consumption: None,
            create_at: None, database_config: None, runtime_context: Some(runtime.clone()), metadata: [("otherone_reasoning_content".into(), json!("Actual public provider reasoning"))].into_iter().collect(),
        }).await.unwrap();
        otherone::storage::write_entry(&WriteEntryOptions {
            storage_type: StorageType::LocalFile, session_id: history.run.clone(), role: "tool".into(), content: String::new(),
            tools: Some(json!({"tool_call_id":"read-1","function_name":"ReadOutline","result":{"revision":7}})), token_consumption: None,
            create_at: None, database_config: None, runtime_context: Some(runtime), metadata: Default::default(),
        }).await.unwrap();
        let messages = history.snapshot().await;
        assert_eq!(
            messages[1]["reasoning_content"],
            "Actual public provider reasoning"
        );
        assert_eq!(
            serde_json::from_str::<Value>(messages[2]["content"].as_str().unwrap()).unwrap()["revision"],
            7
        );
        let connection = crate::db::connect(&history.repository.path).unwrap();
        let saved: String = connection
            .query_row(
                "SELECT history_json FROM generation_runs WHERE id=?1",
                [&history.run],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(
            serde_json::from_str::<Value>(&saved).unwrap(),
            json!(messages)
        );
        assert!(history.read("another-run".into()).await.is_err());
    }

    #[tokio::test]
    async fn compaction_keeps_human_facts_and_frozen_skill_ids_without_accumulating_old_summaries()
    {
        let history = setup(vec![
            json!({"role":"user","name":"yrkie_context_summary","content":"obsolete summary"}),
            json!({"role":"user","content":"Keep 37 exactly."}),
            json!({"role":"assistant","content":"","tool_calls":[{"id":"skill-1","type":"function","function":{"name":"ReadDoeSkill","arguments":"{\"skill\":\"atelier-editorial\"}"}}]}),
            json!({"role":"tool","tool_call_id":"skill-1","content":"{\"status\":\"ok\"}"}),
            json!({"role":"user","content":"Change the title only."}),
        ]);
        history
            .compact(WriteCompactedEntryOptions {
                storage_type: StorageType::LocalFile,
                session_id: history.run.clone(),
                summary: "Current compacted summary".into(),
                trigger_entry_id: "3".into(),
                create_at: None,
                database_config: None,
                runtime_context: None,
                metadata: Default::default(),
            })
            .await
            .unwrap();
        let messages = history.snapshot().await;
        let encoded = json!(messages).to_string();
        assert!(!encoded.contains("obsolete summary"));
        assert!(encoded.contains("Keep 37 exactly."));
        assert!(encoded.contains("Change the title only."));
        assert_eq!(
            crate::generation::context::selected_skill_ids(&messages),
            vec!["atelier-editorial"]
        );
        history.repository.recover_interrupted().unwrap();
        assert!(
            history
                .compact(WriteCompactedEntryOptions {
                    storage_type: StorageType::LocalFile,
                    session_id: history.run.clone(),
                    summary: "late summary".into(),
                    trigger_entry_id: "1".into(),
                    create_at: None,
                    database_config: None,
                    runtime_context: None,
                    metadata: Default::default(),
                })
                .await
                .is_err()
        );
    }
}

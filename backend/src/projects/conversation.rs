//! Durable display history is separate from compactable model context.
use super::{Error, Repository, runs::active_project, validation};
use crate::db;
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde::Serialize;
use serde_json::{Value, json};
use std::collections::{HashMap, HashSet};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversationEvent {
    pub sequence: u64,
    pub run_id: Option<String>,
    pub kind: String,
    pub payload: Value,
    pub created_at: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversationPage {
    pub events: Vec<ConversationEvent>,
    pub cursor: u64,
    pub has_more: bool,
}

impl Repository {
    pub fn conversation(
        &self,
        project: &str,
        after: u64,
        limit: usize,
    ) -> Result<ConversationPage, Error> {
        validation::project_id(project)?;
        let mut connection = db::connect(&self.path)?;
        // The one-time legacy projection and the first reader cannot race a new user action.
        let initialized = connection
            .query_row(
                "SELECT 1 FROM conversation_backfills WHERE project_id=?1",
                [project],
                |_| Ok(()),
            )
            .optional()?
            .is_some();
        if !initialized {
            let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
            ensure_history(&tx, project)?;
            tx.commit()?;
        }
        let limit = limit.clamp(1, 500);
        let mut statement = connection.prepare("SELECT sequence,run_id,kind,payload_json,created_at FROM conversation_events WHERE project_id=?1 AND sequence>?2 ORDER BY sequence LIMIT ?3")?;
        let rows = statement.query_map(params![project, after, limit + 1], |row| {
            Ok((
                row.get::<_, u64>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
            ))
        })?;
        let mut events = Vec::new();
        let mut bytes = 0;
        let mut has_more = false;
        for row in rows {
            let (sequence, run_id, kind, payload, created_at) = row?;
            if events.len() >= limit
                || !events.is_empty() && bytes + payload.len() > 4 * 1024 * 1024
            {
                has_more = true;
                break;
            }
            bytes += payload.len();
            events.push(ConversationEvent {
                sequence,
                run_id,
                kind,
                payload: serde_json::from_str(&payload)?,
                created_at,
            });
        }
        let cursor = events.last().map_or(after, |event| event.sequence);
        Ok(ConversationPage {
            events,
            cursor,
            has_more,
        })
    }

    pub fn append_run_event(&self, run: &str, kind: &str, payload: &Value) -> Result<(), Error> {
        self.append_run_events(run, &[(kind, payload.clone())])
    }

    /// A stream flush is one durable transaction, never one fsync per token.
    pub fn append_run_events(&self, run: &str, events: &[(&str, Value)]) -> Result<(), Error> {
        if events.is_empty() {
            return Ok(());
        }
        if events.len() > 512 {
            return Err(Error::Invalid("The stream flush is too large"));
        }
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let project = match active_project(&tx, run) {
            Ok(project) => project,
            Err(error) if events.iter().all(|(kind,_)| matches!(*kind, "tool_result" | "assistant_done")) => tx.query_row(
                "SELECT project_id FROM generation_runs WHERE id=?1 AND status IN ('completed','questions')",
                [run], |row| row.get::<_,String>(0),
            ).optional()?.ok_or(error)?,
            Err(error) => return Err(error),
        };
        for (kind, payload) in events {
            append(&tx, &project, Some(run), kind, payload, None)?;
        }
        tx.commit()?;
        Ok(())
    }
}

pub(crate) fn append(
    connection: &Connection,
    project: &str,
    run: Option<&str>,
    kind: &str,
    payload: &Value,
    created_at: Option<&str>,
) -> Result<(), Error> {
    validation::request_id(kind)?;
    let encoded = serde_json::to_string(payload)?;
    if !payload.is_object() || encoded.len() > 2 * 1024 * 1024 {
        return Err(Error::Invalid(
            "The conversation event exceeds the supported size",
        ));
    }
    if let Some(run) = run {
        // A display budget failure must never prevent the run's terminal transaction.
        let terminal = matches!(
            kind,
            "run_failed" | "run_completed" | "run_cancelled" | "run_waiting"
        ) && encoded.len() <= 8192;
        let updated = connection.execute("UPDATE generation_runs SET conversation_bytes=conversation_bytes+?2 WHERE id=?1 AND project_id=?3 AND (?4 OR conversation_bytes+?2<=67108864)", params![run,encoded.len(),project,terminal])?;
        if updated == 0 {
            return Err(Error::Invalid(
                "The conversation run exceeds the supported size",
            ));
        }
    }
    connection.execute("INSERT INTO conversation_events(project_id,run_id,kind,payload_json,created_at) VALUES (?1,?2,?3,?4,coalesce(?5,strftime('%Y-%m-%dT%H:%M:%fZ','now')))", params![project,run,kind,encoded,created_at])?;
    Ok(())
}

/// Recover only facts actually retained by the old runtime. Never invent missing stream deltas.
pub(crate) fn ensure_history(connection: &Connection, project: &str) -> Result<(), Error> {
    if connection
        .query_row(
            "SELECT 1 FROM conversation_backfills WHERE project_id=?1",
            [project],
            |_| Ok(()),
        )
        .optional()?
        .is_some()
    {
        return Ok(());
    }
    let (prompt, created): (String, String) = connection
        .query_row(
            "SELECT prompt,created_at FROM projects WHERE id=?1",
            [project],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()?
        .ok_or(Error::NotFound)?;
    append(
        connection,
        project,
        None,
        "user_message",
        &json!({"content":prompt,"action":"create"}),
        Some(&created),
    )?;
    let mut statement = connection.prepare("SELECT id,history_json,status,questions_json,created_at,message,error_code,instruction FROM generation_runs WHERE project_id=?1 ORDER BY rowid")?;
    let rows = statement
        .query_map([project], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, String>(3)?,
                r.get::<_, String>(4)?,
                r.get::<_, String>(5)?,
                r.get::<_, Option<String>>(6)?,
                r.get::<_, Option<String>>(7)?,
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;
    let mut seen_messages = HashMap::<String, usize>::new();
    let mut seen_calls = HashSet::new();
    let mut call_names = HashMap::<String, (String, Value, String)>::new();
    let mut question_receipts = HashSet::new();
    let mut pending_questions: Option<(String, Value)> = None;
    for (run, history, status, questions, created, message, code, instruction) in rows {
        let messages: Vec<Value> = serde_json::from_str(&history)?;
        let mut occurrences = HashMap::<String, usize>::new();
        for (index, item) in messages.iter().enumerate() {
            let key = validation::hash(&serde_json::to_vec(item)?);
            let occurrence = occurrences.entry(key.clone()).or_default();
            *occurrence += 1;
            if *occurrence <= *seen_messages.get(&key).unwrap_or(&0) {
                continue;
            }
            let role = item["role"].as_str().unwrap_or("");
            let content = item["content"].as_str().unwrap_or("");
            let item_id = format!("legacy-{run}-{index}");
            match role {
                "user" => {
                    if content == prompt && index == 0 {
                        continue;
                    }
                    // Model context checkpoints and compaction summaries are not user messages.
                    if content.starts_with("Host state (data,")
                        || content.starts_with("Previously displayed intake questions")
                        || content.starts_with("The last attempted tool was rejected")
                    {
                        continue;
                    }
                    if let Some(raw) = content.strip_prefix("User answers:\n") {
                        if let (Some((request, questions)), Ok(answers)) =
                            (&pending_questions, serde_json::from_str::<Value>(raw))
                        {
                            append(
                                connection,
                                project,
                                Some(&run),
                                "answers",
                                &json!({"requestId":request,"questions":questions,"answers":answers,"content":""}),
                                Some(&created),
                            )?;
                            continue;
                        }
                    }
                    append(
                        connection,
                        project,
                        Some(&run),
                        "user_message",
                        &json!({"content":content,"action":if instruction.as_deref()==Some(content){"continue"}else{"message"}}),
                        Some(&created),
                    )?;
                }
                "assistant" => {
                    if !content.is_empty() {
                        append(
                            connection,
                            project,
                            Some(&run),
                            "assistant_delta",
                            &json!({"messageId":run,"itemId":item_id,"delta":content}),
                            Some(&created),
                        )?;
                        append(
                            connection,
                            project,
                            Some(&run),
                            "assistant_done",
                            &json!({"messageId":run,"itemId":item_id}),
                            Some(&created),
                        )?;
                    }
                    if let Some(calls) = item["tool_calls"].as_array() {
                        for call in calls {
                            let Some(call_id) = call["id"].as_str() else {
                                continue;
                            };
                            let name = call
                                .pointer("/function/name")
                                .and_then(Value::as_str)
                                .unwrap_or("Tool");
                            let args = call
                                .pointer("/function/arguments")
                                .and_then(Value::as_str)
                                .and_then(|raw| serde_json::from_str::<Value>(raw).ok())
                                .unwrap_or(json!({}));
                            call_names.insert(call_id.into(), (name.into(), args, run.clone()));
                            if seen_calls.insert(call_id.to_owned()) {
                                append(
                                    connection,
                                    project,
                                    Some(&run),
                                    "tool_start",
                                    &json!({"messageId":run,"itemId":call_id,"callId":call_id,"name":name}),
                                    Some(&created),
                                )?;
                            }
                        }
                    }
                }
                "tool" => {
                    let Some(call_id) = item["tool_call_id"].as_str() else {
                        continue;
                    };
                    let result =
                        serde_json::from_str::<Value>(content).unwrap_or(json!({"text":content}));
                    let (name, args, owner) = call_names.get(call_id).cloned().unwrap_or((
                        "Tool".into(),
                        json!({}),
                        run.clone(),
                    ));
                    if name == "AskQuestions" && result["status"] == "awaiting_user" {
                        question_receipts.insert(owner.clone());
                        pending_questions = Some((owner.clone(), result["questions"].clone()));
                    }
                    append(
                        connection,
                        project,
                        Some(&run),
                        "tool_result",
                        &json!({"messageId":owner,"itemId":call_id,"callId":call_id,"name":name,"arguments":args,"result":result,"status":if result["status"]=="failed"{"failed"}else{"completed"}}),
                        Some(&created),
                    )?;
                }
                _ => {}
            }
        }
        for (key, count) in occurrences {
            let value = seen_messages.entry(key).or_default();
            *value = (*value).max(count);
        }
        let questions: Value = serde_json::from_str(&questions)?;
        if status == "questions"
            && questions
                .as_array()
                .is_some_and(|questions| !questions.is_empty())
        {
            pending_questions = Some((run.clone(), questions.clone()));
            // Very early old checkpoints could omit the tool receipt but retained the questions row.
            if !question_receipts.contains(&run) {
                let call_id = call_names
                    .iter()
                    .find(|(_, (name, _, owner))| name == "AskQuestions" && owner == &run)
                    .map(|(id, _)| id.clone())
                    .unwrap_or_else(|| format!("questions-{run}"));
                append(
                    connection,
                    project,
                    Some(&run),
                    "tool_result",
                    &json!({"messageId":run,"itemId":call_id,"callId":call_id,"name":"AskQuestions","result":{"status":"awaiting_user","requestId":run,"questions":questions},"status":"completed"}),
                    Some(&created),
                )?;
                question_receipts.insert(run.clone());
            }
        }
        let kind = match status.as_str() {
            "completed" => Some("run_completed"),
            "questions" => Some("run_waiting"),
            "failed" | "interrupted" => Some("run_failed"),
            "cancelled" => Some("run_cancelled"),
            _ => None,
        };
        if let Some(kind) = kind {
            append(
                connection,
                project,
                Some(&run),
                kind,
                &json!({"status":status,"message":message,"errorCode":code}),
                Some(&created),
            )?;
        }
    }
    connection.execute(
        "INSERT INTO conversation_backfills(project_id) VALUES (?1)",
        [project],
    )?;
    Ok(())
}

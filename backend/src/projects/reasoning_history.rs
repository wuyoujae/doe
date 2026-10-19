//! Restore only recorded public provider reasoning into legacy model context.
//! Display history and durable events are never rewritten by this compatibility path.
use super::Error;
use rusqlite::Connection;
use serde_json::Value;
use std::collections::HashMap;

const MAX_ROUND_BYTES: usize = 16 * 1024 * 1024;

#[derive(Default)]
struct Round {
    number: Option<u64>,
    reasoning: String,
    content: String,
    calls: Vec<String>,
    invalid: bool,
}

impl Round {
    fn bind(&mut self, run: &str, item: &str, suffix: &str) {
        let number = item
            .strip_prefix(run)
            .and_then(|item| item.strip_prefix(':'))
            .and_then(|item| item.strip_suffix(suffix))
            .and_then(|number| number.parse::<u64>().ok());
        match (self.number, number) {
            (None, Some(number)) => self.number = Some(number),
            (Some(expected), Some(number)) if expected == number => {}
            _ => self.invalid = true,
        }
    }

    fn push(&mut self, delta: &str, reasoning: bool) {
        if self.invalid {
            return;
        }
        if self.reasoning.len() + self.content.len() + delta.len() > MAX_ROUND_BYTES {
            self.invalid = true;
            self.reasoning.clear();
            self.content.clear();
            return;
        }
        if reasoning {
            self.reasoning.push_str(delta);
        } else {
            self.content.push_str(delta);
        }
    }
}

/// An ambiguous identity stays ambiguous, even if its repeated text is identical.
fn unique(map: &mut HashMap<String, Option<usize>>, key: &str, index: usize) {
    map.entry(key.to_owned())
        .and_modify(|entry| *entry = None)
        .or_insert(Some(index));
}

pub(super) fn restore(
    connection: &Connection,
    run_id: &str,
    history: &mut Vec<Value>,
) -> Result<(), Error> {
    let mut calls = HashMap::new();
    let mut contents = HashMap::new();
    for (index, message) in history.iter().enumerate() {
        if message["role"] != "assistant" {
            continue;
        }
        if let Some(id) = message["tool_calls"]
            .as_array()
            .and_then(|calls| calls.first())
            .and_then(|call| call["id"].as_str())
            .filter(|id| !id.is_empty())
        {
            unique(&mut calls, id, index);
        } else if let Some(content) = message["content"]
            .as_str()
            .filter(|content| !content.is_empty())
        {
            unique(&mut contents, content, index);
        }
    }
    if calls.is_empty() && contents.is_empty() {
        return Ok(());
    }

    // A retried run inherits earlier model messages. Restrict provenance to this
    // project and runs that existed by the requested source run, never future work.
    let mut statement = connection.prepare(
        "SELECT e.run_id,e.kind,e.payload_json FROM conversation_events e \
         JOIN generation_runs r ON r.id=e.run_id \
         JOIN generation_runs target ON target.id=?1 \
         WHERE e.project_id=target.project_id AND r.project_id=target.project_id AND r.rowid<=target.rowid \
         AND e.kind IN ('reasoning_delta','assistant_delta','tool_start','assistant_done','run_completed','run_failed','run_cancelled','run_waiting') \
         ORDER BY e.sequence"
    )?;
    let events = statement.query_map([run_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
        ))
    })?;
    let mut rounds: HashMap<String, Round> = HashMap::new();
    let mut proposals: HashMap<usize, Option<String>> = HashMap::new();
    for event in events {
        let (run, kind, encoded) = event?;
        if matches!(
            kind.as_str(),
            "run_completed" | "run_failed" | "run_cancelled" | "run_waiting"
        ) {
            rounds.remove(&run);
            continue;
        }
        let Ok(payload) = serde_json::from_str::<Value>(&encoded) else {
            continue;
        };
        let state = rounds.entry(run.clone()).or_default();
        match kind.as_str() {
            "reasoning_delta" | "assistant_delta" => {
                let reasoning = kind == "reasoning_delta";
                state.bind(
                    &run,
                    payload["itemId"].as_str().unwrap_or_default(),
                    if reasoning { ":reasoning" } else { ":text" },
                );
                if let Some(delta) = payload["delta"].as_str() {
                    state.push(delta, reasoning);
                } else {
                    state.invalid = true;
                }
            }
            "tool_start" => {
                if let Some(id) = payload["callId"]
                    .as_str()
                    .or_else(|| payload["itemId"].as_str())
                    .filter(|id| !id.is_empty() && id.len() <= 256)
                {
                    if state.calls.len() >= 32 || state.calls.iter().any(|known| known == id) {
                        state.invalid = true;
                    } else {
                        state.calls.push(id.to_owned());
                    }
                } else {
                    state.invalid = true;
                }
            }
            "assistant_done" => {
                state.bind(
                    &run,
                    payload["itemId"].as_str().unwrap_or_default(),
                    ":text",
                );
                let state = rounds.remove(&run).expect("round was inserted");
                if state.invalid || state.reasoning.is_empty() {
                    continue;
                }
                let target = if let Some(first) = state.calls.first() {
                    calls.get(first).copied().flatten()
                } else {
                    contents.get(&state.content).copied().flatten()
                };
                if let Some(index) = target {
                    proposals
                        .entry(index)
                        .and_modify(|entry| *entry = None)
                        .or_insert(Some(state.reasoning));
                }
            }
            _ => {}
        }
    }
    for (index, reasoning) in proposals {
        if let Some(reasoning) = reasoning {
            let message = &mut history[index];
            if message.get("reasoning_content").is_none()
                && message.get("reasoningContent").is_none()
            {
                message["reasoning_content"] = Value::String(reasoning);
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;
    use serde_json::json;

    fn database() -> Connection {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch("CREATE TABLE generation_runs(id TEXT PRIMARY KEY,project_id TEXT); CREATE TABLE conversation_events(sequence INTEGER PRIMARY KEY,run_id TEXT,project_id TEXT,kind TEXT,payload_json TEXT); INSERT INTO generation_runs VALUES('one','project'),('two','project'),('future','project'),('other','other-project');").unwrap();
        c
    }
    fn event(c: &Connection, run: &str, kind: &str, payload: Value) {
        c.execute("INSERT INTO conversation_events(run_id,project_id,kind,payload_json) SELECT id,project_id,?2,?3 FROM generation_runs WHERE id=?1", params![run,kind,payload.to_string()]).unwrap();
    }
    fn complete(
        c: &Connection,
        run: &str,
        number: usize,
        call: Option<&str>,
        content: &str,
        reasoning: &str,
    ) {
        event(
            c,
            run,
            "reasoning_delta",
            json!({"itemId":format!("{run}:{number}:reasoning"),"delta":reasoning}),
        );
        event(
            c,
            run,
            "assistant_delta",
            json!({"itemId":format!("{run}:{number}:text"),"delta":content}),
        );
        if let Some(call) = call {
            event(c, run, "tool_start", json!({"callId":call}));
        }
        event(
            c,
            run,
            "assistant_done",
            json!({"itemId":format!("{run}:{number}:text")}),
        );
    }
    fn assistant(call: &str) -> Value {
        json!({"role":"assistant","content":null,"tool_calls":[{"id":call,"type":"function","function":{"name":"ReadOutline","arguments":"{}"}}]})
    }

    #[test]
    fn restores_exact_recorded_fragments_across_inherited_runs_only() {
        let c = database();
        event(
            &c,
            "one",
            "reasoning_delta",
            json!({"itemId":"one:0:reasoning","delta":"先"}),
        );
        event(
            &c,
            "one",
            "reasoning_delta",
            json!({"itemId":"one:0:reasoning","delta":"读大纲"}),
        );
        event(&c, "one", "tool_start", json!({"callId":"read"}));
        event(&c, "one", "assistant_done", json!({"itemId":"one:0:text"}));
        complete(&c, "two", 0, Some("edit"), "", "再编辑");
        complete(&c, "future", 0, Some("future-call"), "", "不得使用未来记录");
        complete(&c, "other", 0, Some("foreign-call"), "", "不得使用其他项目");
        let mut history = vec![
            assistant("read"),
            assistant("edit"),
            assistant("future-call"),
            assistant("foreign-call"),
        ];
        restore(&c, "two", &mut history).unwrap();
        assert_eq!(history[0]["reasoning_content"], "先读大纲");
        assert_eq!(history[1]["reasoning_content"], "再编辑");
        assert!(history[2].get("reasoning_content").is_none());
        assert!(history[3].get("reasoning_content").is_none());
    }

    #[test]
    fn repeated_call_ids_or_ambiguous_text_never_guess() {
        let c = database();
        complete(&c, "one", 0, Some("reused"), "", "first");
        complete(&c, "two", 0, Some("reused"), "", "second");
        complete(&c, "two", 1, None, "same answer", "text reasoning");
        let mut history = vec![
            assistant("reused"),
            json!({"role":"assistant","content":"same answer"}),
            json!({"role":"assistant","content":"same answer"}),
        ];
        restore(&c, "two", &mut history).unwrap();
        assert!(
            history
                .iter()
                .all(|message| message.get("reasoning_content").is_none())
        );
        let mut repeated_history = vec![assistant("reused"), assistant("reused")];
        restore(&c, "two", &mut repeated_history).unwrap();
        assert!(
            repeated_history
                .iter()
                .all(|message| message.get("reasoning_content").is_none())
        );
    }

    #[test]
    fn keeps_existing_fields_and_ignores_incomplete_or_mixed_rounds() {
        let c = database();
        complete(&c, "one", 0, Some("keep"), "", "must not overwrite");
        complete(
            &c,
            "one",
            1,
            None,
            "unique answer",
            "recorded public reasoning",
        );
        event(
            &c,
            "two",
            "reasoning_delta",
            json!({"itemId":"two:0:reasoning","delta":"partial"}),
        );
        event(&c, "two", "tool_start", json!({"callId":"partial"}));
        event(&c, "two", "assistant_done", json!({"itemId":"two:1:text"}));
        event(
            &c,
            "two",
            "reasoning_delta",
            json!({"itemId":"two:2:reasoning","delta":"unfinished"}),
        );
        event(&c, "two", "tool_start", json!({"callId":"unfinished"}));
        let mut kept = assistant("keep");
        kept["reasoning_content"] = json!("");
        let mut history = vec![
            kept,
            json!({"role":"assistant","content":"unique answer"}),
            assistant("partial"),
            assistant("unfinished"),
        ];
        restore(&c, "two", &mut history).unwrap();
        assert_eq!(history[0]["reasoning_content"], "");
        assert_eq!(history[1]["reasoning_content"], "recorded public reasoning");
        assert!(history[2].get("reasoning_content").is_none());
        assert!(history[3].get("reasoning_content").is_none());
    }
}

//! Original DOE history projection, Oct 12 baseline. Storage and provider adapters share it.
use otherone::ai::types::{Message, MessageContent};
use serde_json::{Value, json};

/// Preserve user decisions across tasks without replaying obsolete document payloads.
pub fn filter(mut messages: Vec<Message>) -> Result<Vec<Message>, String> {
    let current = messages
        .iter()
        .rposition(|message| message.role == "user")
        .ok_or("doe_agent_current_request_missing")?;
    let system = messages
        .iter()
        .rposition(|message| message.role == "system");
    for message in messages.iter_mut().take(current) {
        if let Some(calls) = message.tool_calls.as_mut() {
            for call in calls {
                call.function.arguments =
                    json!({"historicalPayload":"omitted; read the current saved document"})
                        .to_string();
            }
        }
        if message.role == "tool" {
            let mut content = match &message.content {
                MessageContent::Text(text) => serde_json::from_str::<Value>(text).ok(),
                _ => None,
            };
            // Persisted tool strings can have a JSON envelope; the compaction hook
            // and provider resolver may also project the same message twice.
            if let Some(Value::String(text)) = &content {
                content = serde_json::from_str(text).ok();
            }
            if let Some(previous) = content.as_ref().and_then(|v| v.get("historicalReceipt")) {
                content = Some(previous.clone());
            }
            let mut receipt = serde_json::Map::new();
            if let Some(value) = content {
                for key in [
                    "status",
                    "committed",
                    "operation",
                    "outlineId",
                    "slideId",
                    "revision",
                    "pageNumber",
                    "pageCount",
                    "alreadyCommitted",
                    "error",
                ] {
                    if let Some(value) = value.get(key).filter(|v| !v.is_object() && !v.is_array())
                    {
                        receipt.insert(key.into(), value.clone());
                    }
                }
            }
            message.content=MessageContent::Text(json!({"historicalReceipt":receipt,"note":"Read current saved content when needed."}).to_string());
        }
        if message.role == "user" {
            if let MessageContent::MultiPart(parts) = &mut message.content {
                // Old authorized media URLs/bytes are reconstructed from current attachment_refs.
                parts.retain(|part| part.content_type == "text");
            }
        }
    }
    Ok(messages
        .into_iter()
        .enumerate()
        .filter_map(|(i, m)| {
            if m.role == "system" && Some(i) != system {
                return None;
            }
            if i < current {
                if let MessageContent::Text(text) = &m.content {
                    if let Ok(value) = serde_json::from_str::<Value>(text) {
                        // Keep only the fresh ephemeral context immediately preceding this task.
                        if value["context_type"] == "yrkie.doe.direct.v1" && i + 1 != current {
                            return None;
                        }
                    }
                }
            }
            Some(m)
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn message(role: &str, text: &str) -> Message {
        Message {
            reasoning_content: None,
            role: role.into(),
            content: MessageContent::Text(text.into()),
            name: None,
            tool_calls: None,
            tool_call_id: None,
        }
    }
    #[test]
    fn preserves_requirements_and_current_tools_but_removes_old_document() {
        let messages = vec![
            message("system", "rules"),
            message("user", "Keep the disclaimer"),
            message(
                "tool",
                r#"{"status":"succeeded","revision":3,"deck":{"private":"old body"}}"#,
            ),
            message("user", "Change the title"),
            message("tool", r#"{"slide":{"private":"current body"}}"#),
        ];
        let result = filter(messages).unwrap();
        let text = serde_json::to_string(&result).unwrap();
        assert!(text.contains("Keep the disclaimer"));
        assert!(text.contains("current body"));
        assert!(!text.contains("old body"));
        assert!(text.contains("revision"));
        assert_eq!(
            serde_json::to_value(filter(result.clone()).unwrap()).unwrap(),
            serde_json::to_value(result).unwrap()
        );
    }
}

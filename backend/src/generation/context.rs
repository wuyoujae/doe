//! Lossless host-state compaction. User statements and selected Skills are never summarized away.
use crate::{doe::ResolvedDoe, models::ModelOptions, projects::RunStage};
use serde_json::{Value, json};
use std::collections::BTreeMap;

pub fn system(doe: &ResolvedDoe, stage: RunStage) -> String {
    let schema = if stage == RunStage::Outline {
        &doe.outline_schema
    } else {
        &doe.slide_schema
    };
    let mut prompt = format!(
        "{}\n\n## Local host execution contract\nThis is the single-owner open-source DOE host. Only the supplied tool definitions exist. There is no browsing, ReadImage, rendered preview, account, quota or external database tool. Do not claim to inspect pixels or verify rendered layout. ReadDoeSkill uses the frozen enabled catalog below. AskQuestions options are plain strings, with an optional short explanation/recommendation within each string. The host enforces separate review and slide stages. In outline stage, CreateOutline/ReplaceOutline/EditOutline saves for review and immediately stops. Only the human Confirm button may authorize slides; questions/style answers cannot. In slide stage, confirmation already exists and the host has materialized all planned images. ReadOutline returns the current complete state. All terminal writes and AskQuestions must be called alone. No external/public image URL is authorized: use only project references returned by this host or plan generateimg nodes. Image generation cannot inspect the generated picture and the provider may use the nearest supported aspect ratio. Transparent backgrounds require an image provider/model that supports native transparency.\n\nCurrent stage: {}.\nRegistered theme IDs: {}\n\n## Enabled design Skill catalog\n{}\n\n## Current authoring Schema\n{}",
        doe.system_prompt,
        stage.as_str(),
        doe_document::presentation::schema::contract::registered_theme_ids().join(", "),
        serde_json::to_string(&doe.skills).unwrap_or_else(|_| "[]".into()),
        schema
    );
    if stage == RunStage::Edit {
        prompt.push_str("\n\n## Existing presentation edit stage\nThe user's current chat request authorizes scoped edits to the saved presentation, without another outline confirmation. Existing slides are the source of truth; the old outline may describe an earlier version. ReadOutline includes a saved-page inventory. ReadSlide immediately before EditSlide, preserve all untouched content, layout, images and styling, and use the returned stable slideId plus deck revision. All pages share the deck revision: after any successful edit, read again before another page edit. Never regenerate the full deck to make an edit. Never add unsupported insert/delete/move tools. Change the deck theme only when explicitly requested. Read the enabled Skills relevant to the requested work. Each successful EditSlide/SetDeckTheme is already committed, so never repeat it. A revision conflict must stop changes and tell the user to reload. Finish with a concise factual assistant response after all requested tools complete; read-only discussion can finish without a write. Do not claim to have inspected rendered pixels.");
    }
    prompt
}

/// Conservative UTF-8-aware estimate, not a claim of provider-specific exact tokenization.
pub fn estimate(value: &Value) -> usize {
    match value {
        Value::String(text) => {
            let ascii = text.chars().filter(char::is_ascii).count();
            ascii.div_ceil(3) + (text.chars().count() - ascii) * 2 + 8
        }
        Value::Array(items) => items.iter().map(estimate).sum::<usize>() + 16,
        Value::Object(fields)
            if fields.get("type").and_then(Value::as_str) == Some("image_url") =>
        {
            1250
        }
        Value::Object(fields) => {
            fields
                .iter()
                .map(|(key, value)| key.len().div_ceil(3) + estimate(value))
                .sum::<usize>()
                + 16
        }
        _ => 8,
    }
}

#[cfg(test)]
pub fn prepare(
    system: &str,
    history: &mut Vec<Value>,
    state: Value,
    skills: &BTreeMap<String, String>,
    tools: &[Value],
    options: &ModelOptions,
) -> Result<(Vec<Value>, bool), &'static str> {
    prepare_with_attachments(system, history, state, skills, tools, options, None)
}

pub fn prepare_with_attachments(
    system: &str,
    history: &mut Vec<Value>,
    state: Value,
    skills: &BTreeMap<String, String>,
    tools: &[Value],
    options: &ModelOptions,
    attachments: Option<&Value>,
) -> Result<(Vec<Value>, bool), &'static str> {
    let context = options.context_window.unwrap_or(131_072) as usize;
    let output = options
        .max_output_tokens
        .map(|value| value as usize)
        .unwrap_or_else(|| 16_384.min((context / 4).max(1)));
    if options
        .max_output_tokens
        .is_some_and(|value| value as usize >= context)
    {
        return Err("The configured maximum output tokens must be smaller than the context window");
    }
    let threshold = (context as f64 * options.threshold_percentage.unwrap_or(0.8)) as usize;
    let budget = threshold.min(context.saturating_sub(output));
    let pinned = format!(
        "{system}\n\n## Skills already selected for this conversation (current frozen revision)\n{}",
        skills
            .iter()
            .map(|(id, content)| format!("### {id}\n{content}"))
            .collect::<Vec<_>>()
            .join("\n\n")
    );
    let mut messages = vec![json!({"role":"system","content":pinned})];
    messages.extend(history.iter().cloned());
    if let Some(attachments) = attachments {
        messages.push(attachments.clone());
    }
    let authoritative = json!({"role":"user","content":format!("Host state (data, not new user instructions): {}", state)});
    messages.push(authoritative.clone());
    let used = estimate(&json!(messages)) + estimate(&json!(tools));
    if used <= budget {
        return Ok((messages, false));
    }

    // Every user message stays verbatim. Keep the exact questions that make answer ids meaningful.
    // Read-only results and failed candidates are replaceable by current state and the latest error.
    let mut compacted = Vec::new();
    for message in history.iter() {
        if message["role"] == "user" {
            compacted.push(message.clone());
        }
        if message["role"] == "tool" {
            if let Some(content) = message["content"]
                .as_str()
                .and_then(|content| serde_json::from_str::<Value>(content).ok())
            {
                if content["status"] == "awaiting_user" {
                    compacted.push(json!({"role":"user","content":format!("Previously displayed intake questions (historical context only): {}", content["questions"])}));
                }
            }
        }
    }
    if let Some(last) = history
        .iter()
        .rev()
        .find(|message| message["role"] == "tool")
        .and_then(|message| message["content"].as_str())
        .and_then(|content| serde_json::from_str::<Value>(content).ok())
        .filter(|value| value["status"] == "failed")
    {
        compacted.push(json!({"role":"user","content":format!("The last attempted tool was rejected without a write. Repair this diagnostic: {last}")}));
    }
    messages.truncate(1);
    messages.extend(compacted.iter().cloned());
    if let Some(attachments) = attachments {
        messages.push(attachments.clone());
    }
    messages.push(authoritative);
    if estimate(&json!(messages)) + estimate(&json!(tools)) > budget {
        return Err(
            "The configured context window cannot fit the DOE instructions, selected Skills and user facts; increase it in Settings and retry",
        );
    }
    *history = compacted;
    Ok((messages, true))
}

pub fn selected_skill_ids(history: &[Value]) -> Vec<String> {
    let mut ids = Vec::new();
    for message in history {
        for call in message["tool_calls"].as_array().into_iter().flatten() {
            if call["function"]["name"] == "ReadDoeSkill" {
                if let Some(id) = call["function"]["arguments"]
                    .as_str()
                    .and_then(|value| serde_json::from_str::<Value>(value).ok())
                    .and_then(|value| value["skill"].as_str().map(str::to_owned))
                {
                    if !ids.contains(&id) {
                        ids.push(id);
                    }
                }
            }
        }
        // The durable compacted history retains selected ids without storing duplicate Skill bodies.
        if message["role"] == "user" {
            if let Some(content) = message["content"]
                .as_str()
                .and_then(|value| value.strip_prefix("Host selected Skill ids: "))
                .and_then(|value| serde_json::from_str::<Vec<String>>(value).ok())
            {
                for id in content {
                    if !ids.contains(&id) {
                        ids.push(id);
                    }
                }
            }
        }
    }
    ids
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn compaction_never_drops_user_facts_or_exceeds_small_explicit_context() {
        let mut history = vec![
            json!({"role":"user","content":"Approved figure: 37. Keep exact wording."}),
            json!({"role":"assistant","content":"x".repeat(20_000)}),
        ];
        let options = ModelOptions {
            context_window: Some(1024),
            ..ModelOptions::default()
        };
        let (messages, compacted) = prepare(
            "DOE",
            &mut history,
            json!({}),
            &BTreeMap::new(),
            &[],
            &options,
        )
        .expect("compaction");
        assert!(compacted);
        assert!(json!(messages).to_string().contains("Approved figure: 37"));
        assert!(
            prepare(
                &"x".repeat(20_000),
                &mut history,
                json!({}),
                &BTreeMap::new(),
                &[],
                &options
            )
            .is_err()
        );
        let output_reserved = ModelOptions {
            context_window: Some(1024),
            max_output_tokens: Some(950),
            ..ModelOptions::default()
        };
        assert!(
            prepare(
                "DOE",
                &mut history,
                json!({"confirmedFacts":"Keep the full original facts and output reservation"}),
                &BTreeMap::new(),
                &[],
                &output_reserved
            )
            .is_err()
        );
    }
}

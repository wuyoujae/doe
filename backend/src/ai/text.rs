//! The provider response is untrusted: bound it before parsing and never echo provider bodies.
use super::prepare_text;
use crate::models::ResolvedModel;
use serde_json::{Value, json};
use std::borrow::Cow;
use std::collections::{BTreeMap, HashSet};
use std::future::Future;
use tokio::sync::watch;
use tokio::time::{Duration, Instant};

const MAX_RESPONSE_BYTES: usize = 16 * 1024 * 1024;
const MAX_ARGUMENT_BYTES: usize = 2 * 1024 * 1024;
const STREAM_FLUSH_INTERVAL: Duration = Duration::from_millis(50);
const STREAM_FLUSH_BYTES: usize = 8 * 1024;
const STREAM_FLUSH_EVENTS: usize = 128;

#[derive(Debug, thiserror::Error)]
#[error("{message}")]
pub struct TextError {
    pub code: &'static str,
    pub message: &'static str,
}

impl TextError {
    fn new(code: &'static str, message: &'static str) -> Self {
        Self { code, message }
    }
    pub fn cancelled() -> Self {
        Self::new("cancelled", "Generation was cancelled")
    }
    fn protocol() -> Self {
        Self::new(
            "provider_protocol_error",
            "The text provider returned an incomplete or invalid OpenAI-compatible response",
        )
    }
}

#[derive(Clone)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: String,
}

pub struct Completion {
    pub content: String,
    pub calls: Vec<ToolCall>,
    pub(crate) reasoning_content: Option<String>,
    visible_reasoning: String,
}

#[derive(Debug, Clone)]
pub enum StreamEvent {
    Text(String),
    Reasoning(String),
    Tool {
        index: usize,
        id: String,
        name: String,
        arguments: String,
    },
}

/// Bound persistence work independently of the provider's token-sized HTTP chunks.
/// Merging only adjacent items retains the provider's text/reasoning/tool ordering.
#[derive(Default)]
struct EventBuffer {
    events: Vec<StreamEvent>,
    bytes: usize,
}

impl EventBuffer {
    fn append(&mut self, events: impl IntoIterator<Item = StreamEvent>) {
        for event in events {
            self.bytes += match &event {
                StreamEvent::Text(value) | StreamEvent::Reasoning(value) => value.len(),
                StreamEvent::Tool { arguments, .. } => arguments.len() + 64,
            };
            match (self.events.last_mut(), &event) {
                (Some(StreamEvent::Text(previous)), StreamEvent::Text(next))
                | (Some(StreamEvent::Reasoning(previous)), StreamEvent::Reasoning(next)) => {
                    previous.push_str(next);
                }
                (
                    Some(StreamEvent::Tool {
                        index: previous_index,
                        id: previous_id,
                        name: previous_name,
                        arguments: previous_arguments,
                    }),
                    StreamEvent::Tool {
                        index,
                        id,
                        name,
                        arguments,
                    },
                ) if previous_index == index && previous_id == id && previous_name == name => {
                    previous_arguments.push_str(arguments);
                }
                _ => self.events.push(event),
            }
        }
    }

    fn take(&mut self) -> Vec<StreamEvent> {
        self.bytes = 0;
        std::mem::take(&mut self.events)
    }
}

impl Completion {
    pub fn message(&self) -> Value {
        let mut result = json!({"role":"assistant","content": if self.content.is_empty() { Value::Null } else { json!(self.content) }});
        if !self.calls.is_empty() {
            result["tool_calls"] = json!(self.calls.iter().map(|call| json!({"id":call.id,"type":"function","function":{"name":call.name,"arguments":call.arguments}})).collect::<Vec<_>>());
        }
        // DeepSeek thinking-mode tool turns require this exact provider-returned
        // field on subsequent requests. Never reconstruct it from assistant text.
        if let Some(reasoning) = &self.reasoning_content {
            result["reasoning_content"] = json!(reasoning);
        }
        result
    }
}

pub async fn complete(
    model: &ResolvedModel,
    messages: Vec<Value>,
    tools: Vec<Value>,
    cancellation: watch::Receiver<bool>,
) -> Result<Completion, TextError> {
    complete_streaming(model, messages, tools, cancellation, |_| async { Ok(()) }).await
}

pub async fn complete_streaming<F, Fut>(
    model: &ResolvedModel,
    messages: Vec<Value>,
    tools: Vec<Value>,
    mut cancellation: watch::Receiver<bool>,
    mut emit: F,
) -> Result<Completion, TextError>
where
    F: FnMut(Vec<StreamEvent>) -> Fut,
    Fut: Future<Output = Result<(), TextError>>,
{
    if *cancellation.borrow() {
        return Err(TextError::cancelled());
    }
    let prepared = prepare_text(model, messages, Some(tools)).map_err(|_| {
        TextError::new(
            "model_not_configured",
            "Configure the text model in Settings before generating",
        )
    })?;
    let response = tokio::select! {
        _ = cancellation.changed() => return Err(TextError::cancelled()),
        response = prepared.client.execute(prepared.request) => response.map_err(|error| if error.is_timeout() {
            TextError::new("provider_timeout", "The text provider timed out; review the project before explicitly retrying")
        } else { TextError::new("provider_connection_failed", "Could not connect to the configured text provider") })?,
    };
    if !response.status().is_success() {
        return Err(match response.status().as_u16() {
            401 | 403 => TextError::new(
                "provider_authentication_failed",
                "The text provider rejected the API key or model access; check Settings",
            ),
            429 => TextError::new(
                "provider_rate_limited",
                "The text provider rejected this request because of a rate or quota limit; retry explicitly when available",
            ),
            400 | 404 | 422 => TextError::new(
                "provider_request_rejected",
                "The text provider rejected the model, endpoint or options; check Settings and tool-call support",
            ),
            _ => TextError::new(
                "provider_unavailable",
                "The text provider could not complete the request; no automatic retry was made",
            ),
        });
    }
    if response
        .content_length()
        .is_some_and(|size| size > MAX_RESPONSE_BYTES as u64)
    {
        return Err(TextError::new(
            "provider_response_too_large",
            "The text provider response exceeded the safe size limit",
        ));
    }
    let streaming = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .is_some_and(|value| value.starts_with("text/event-stream"));
    let mut response = response;
    let mut bytes = Vec::new();
    let mut parser = StreamParser::default();
    let mut buffered = EventBuffer::default();
    let flush = tokio::time::sleep(STREAM_FLUSH_INTERVAL);
    tokio::pin!(flush);
    let mut total = 0;
    loop {
        let chunk = tokio::select! {
            biased;
            _ = cancellation.changed() => return Err(TextError::cancelled()),
            _ = &mut flush, if !buffered.events.is_empty() => {
                emit(buffered.take()).await?;
                continue;
            },
            chunk = response.chunk() => chunk.map_err(|error| if error.is_timeout() { TextError::new("provider_timeout", "The text provider stream timed out; no incomplete tool was executed") } else { TextError::protocol() })?,
        };
        let Some(chunk) = chunk else {
            break;
        };
        total += chunk.len();
        if total > MAX_RESPONSE_BYTES {
            return Err(TextError::new(
                "provider_response_too_large",
                "The text provider response exceeded the safe size limit",
            ));
        }
        if streaming {
            parser.feed(&chunk)?;
            for event in std::mem::take(&mut parser.events) {
                if buffered.events.is_empty() {
                    flush.as_mut().reset(Instant::now() + STREAM_FLUSH_INTERVAL);
                }
                buffered.append([event]);
                if buffered.bytes >= STREAM_FLUSH_BYTES
                    || buffered.events.len() >= STREAM_FLUSH_EVENTS
                {
                    emit(buffered.take()).await?;
                }
            }
            if !buffered.events.is_empty() && parser.done {
                emit(buffered.take()).await?;
            }
            if parser.done {
                break;
            }
        } else {
            bytes.extend_from_slice(&chunk);
        }
    }
    if streaming {
        parser.feed(b"\n\n")?;
        buffered.append(std::mem::take(&mut parser.events));
        if !buffered.events.is_empty() {
            emit(buffered.take()).await?;
        }
        parser.finish()
    } else {
        let completion = parse_json(&bytes)?;
        let mut events = Vec::new();
        if !completion.visible_reasoning.is_empty() {
            events.push(StreamEvent::Reasoning(completion.visible_reasoning.clone()));
        }
        if !completion.content.is_empty() {
            events.push(StreamEvent::Text(completion.content.clone()));
        }
        for (index, call) in completion.calls.iter().enumerate() {
            events.push(StreamEvent::Tool {
                index,
                id: call.id.clone(),
                name: call.name.clone(),
                arguments: call.arguments.clone(),
            });
        }
        emit(events).await?;
        Ok(completion)
    }
}

fn validate(completion: Completion, finish: Option<&str>) -> Result<Completion, TextError> {
    if matches!(finish, Some("length" | "max_tokens")) {
        return Err(TextError::new(
            "provider_output_truncated",
            "The text model reached its output limit; increase the maximum output tokens and retry",
        ));
    }
    if matches!(finish, Some("content_filter" | "refusal")) {
        return Err(TextError::new(
            "provider_refused",
            "The text model declined this request",
        ));
    }
    let mut ids = HashSet::new();
    if completion.calls.len() > 32
        || completion.calls.iter().any(|call| {
            call.id.is_empty()
                || call.id.len() > 256
                || call.name.is_empty()
                || call.name.len() > 128
                || call.arguments.len() > MAX_ARGUMENT_BYTES
                || !ids.insert(&call.id)
        })
    {
        return Err(TextError::protocol());
    }
    if completion.content.is_empty() && completion.calls.is_empty() {
        return Err(TextError::protocol());
    }
    Ok(completion)
}

fn parse_json(bytes: &[u8]) -> Result<Completion, TextError> {
    let value: Value = serde_json::from_slice(bytes).map_err(|_| TextError::protocol())?;
    let choice = value["choices"]
        .as_array()
        .and_then(|items| items.first())
        .ok_or_else(TextError::protocol)?;
    let message = &choice["message"];
    let mut calls = Vec::new();
    if let Some(items) = message["tool_calls"].as_array() {
        for call in items {
            if call["type"] != "function" {
                return Err(TextError::protocol());
            }
            calls.push(ToolCall {
                id: call["id"].as_str().ok_or_else(TextError::protocol)?.into(),
                name: call["function"]["name"]
                    .as_str()
                    .ok_or_else(TextError::protocol)?
                    .into(),
                arguments: call["function"]["arguments"]
                    .as_str()
                    .ok_or_else(TextError::protocol)?
                    .into(),
            });
        }
    }
    validate(
        Completion {
            content: message["content"].as_str().unwrap_or_default().into(),
            calls,
            reasoning_content: reasoning_content(message).map(str::to_owned),
            visible_reasoning: visible_reasoning(message)
                .map(Cow::into_owned)
                .unwrap_or_default(),
        },
        choice["finish_reason"].as_str(),
    )
}

#[derive(Default)]
struct StreamParser {
    pending: Vec<u8>,
    event: String,
    content: String,
    reasoning_content: Option<String>,
    calls: BTreeMap<usize, ToolCall>,
    finish_reason: Option<String>,
    done: bool,
    events: Vec<StreamEvent>,
}

impl StreamParser {
    fn feed(&mut self, bytes: &[u8]) -> Result<(), TextError> {
        if self.done {
            return Ok(());
        }
        self.pending.extend_from_slice(bytes);
        // Drain once per HTTP chunk; repeatedly moving the remaining bytes is quadratic
        // when a gateway delivers many SSE lines in one chunk.
        let mut pending = std::mem::take(&mut self.pending);
        let mut start = 0;
        for end in pending
            .iter()
            .enumerate()
            .filter_map(|(index, byte)| (*byte == b'\n').then_some(index))
        {
            let line = std::str::from_utf8(&pending[start..end])
                .map_err(|_| TextError::protocol())?
                .trim_end_matches('\r');
            start = end + 1;
            if line.is_empty() {
                self.dispatch()?;
                if self.done {
                    break;
                }
            } else if let Some(data) = line.strip_prefix("data:") {
                if !self.event.is_empty() {
                    self.event.push('\n');
                }
                self.event.push_str(data.strip_prefix(' ').unwrap_or(data));
            }
        }
        if !self.done {
            pending.drain(..start);
            self.pending = pending;
        }
        Ok(())
    }

    fn dispatch(&mut self) -> Result<(), TextError> {
        let data = std::mem::take(&mut self.event);
        if data.is_empty() {
            return Ok(());
        }
        if data.trim() == "[DONE]" {
            self.done = true;
            return Ok(());
        }
        let value: Value = serde_json::from_str(&data).map_err(|_| TextError::protocol())?;
        if value.get("error").is_some() {
            return Err(TextError::protocol());
        }
        let Some(choices) = value["choices"].as_array() else {
            return Err(TextError::protocol());
        };
        for choice in choices {
            if choice["index"].as_u64().unwrap_or(0) != 0 {
                continue;
            }
            if let Some(reason) = choice["finish_reason"].as_str() {
                self.finish_reason = Some(reason.into());
                // A choice's finish_reason is the OpenAI completion boundary. Some
                // compatible gateways keep the transport open after this event.
                // This host has no trailing usage dependency, so never wait for EOF.
                self.done = true;
            }
            let delta = &choice["delta"];
            if let Some(content) = delta["content"].as_str() {
                self.content.push_str(content);
                if !content.is_empty() {
                    self.events.push(StreamEvent::Text(content.into()));
                }
            }
            // Only explicitly public provider fields are forwarded, never synthesized reasoning.
            if let Some(reasoning) = reasoning_content(delta) {
                self.reasoning_content
                    .get_or_insert_with(String::new)
                    .push_str(reasoning);
            }
            if let Some(reasoning) = visible_reasoning(delta) {
                if !reasoning.is_empty() {
                    self.events
                        .push(StreamEvent::Reasoning(reasoning.into_owned()));
                }
            }
            if let Some(calls) = delta["tool_calls"].as_array() {
                for call in calls {
                    let index = call["index"].as_u64().ok_or_else(TextError::protocol)? as usize;
                    if index >= 32 {
                        return Err(TextError::protocol());
                    }
                    let target = self.calls.entry(index).or_insert_with(|| ToolCall {
                        id: String::new(),
                        name: String::new(),
                        arguments: String::new(),
                    });
                    if let Some(id) = call["id"].as_str() {
                        merge_identity(&mut target.id, id, 512)?;
                    }
                    if let Some(name) = call["function"]["name"].as_str() {
                        merge_identity(&mut target.name, name, 128)?;
                    }
                    if let Some(arguments) = call["function"]["arguments"].as_str() {
                        target.arguments.push_str(arguments);
                    }
                    if target.arguments.len() > MAX_ARGUMENT_BYTES {
                        return Err(TextError::protocol());
                    }
                    self.events.push(StreamEvent::Tool {
                        index,
                        id: target.id.clone(),
                        name: target.name.clone(),
                        arguments: call["function"]["arguments"]
                            .as_str()
                            .unwrap_or_default()
                            .into(),
                    });
                }
            }
        }
        Ok(())
    }

    fn finish(mut self) -> Result<Completion, TextError> {
        if !self.pending.is_empty() {
            self.feed(b"\n")?;
        }
        self.dispatch()?;
        if !self.done && self.finish_reason.is_none() {
            return Err(TextError::protocol());
        }
        validate(
            Completion {
                content: self.content,
                calls: self.calls.into_values().collect(),
                reasoning_content: self.reasoning_content,
                // Streaming reasoning was already delivered and is not emitted again.
                visible_reasoning: String::new(),
            },
            self.finish_reason.as_deref(),
        )
    }
}

fn merge_identity(target: &mut String, delta: &str, limit: usize) -> Result<(), TextError> {
    if target == delta || delta.is_empty() {
        return Ok(());
    }
    if delta.starts_with(target.as_str()) {
        *target = delta.into();
    } else {
        target.push_str(delta);
    }
    if target.len() > limit {
        return Err(TextError::protocol());
    }
    Ok(())
}

fn reasoning_content(value: &Value) -> Option<&str> {
    value["reasoning_content"]
        .as_str()
        .or_else(|| value["reasoningContent"].as_str())
}

/// Match the original framework's explicitly public reasoning fields. Encrypted
/// reasoning details are provider continuation data, never user-visible text.
fn visible_reasoning(value: &Value) -> Option<Cow<'_, str>> {
    for field in [
        "reasoning_content",
        "reasoningContent",
        "reasoning",
        "thinking",
        "thought",
    ] {
        if let Some(text) = value[field].as_str().filter(|text| !text.is_empty()) {
            return Some(Cow::Borrowed(text));
        }
    }
    let details = value["reasoning_details"].as_array()?;
    let text = details
        .iter()
        .filter_map(|detail| match detail["type"].as_str() {
            Some("reasoning.summary") => detail["summary"].as_str(),
            Some("reasoning.text") => detail["text"].as_str(),
            _ => None,
        })
        .filter(|text| !text.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n");
    (!text.is_empty()).then_some(Cow::Owned(text))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{EndpointView, ModelOptions};
    use axum::{
        Router,
        body::{Body, Bytes},
        response::Response,
        routing::post,
    };
    use futures_util::StreamExt;
    use std::{
        convert::Infallible,
        sync::{Arc, Mutex},
    };
    use zeroize::Zeroizing;

    async fn fixture_model(router: Router) -> (ResolvedModel, tokio::task::JoinHandle<()>) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let server = tokio::spawn(async move { axum::serve(listener, router).await.unwrap() });
        (
            ResolvedModel {
                endpoint: EndpointView {
                    provider: "custom".into(),
                    base_url: format!("http://{address}/v1"),
                    model: "local-fixture".into(),
                    has_api_key: false,
                    options: ModelOptions::default(),
                },
                api_key: Zeroizing::new(String::new()),
            },
            server,
        )
    }

    fn sse_response(
        stream: impl futures_util::Stream<Item = Result<Bytes, Infallible>> + Send + 'static,
    ) -> Response {
        Response::builder()
            .header("content-type", "text/event-stream")
            .body(Body::from_stream(stream))
            .unwrap()
    }

    #[tokio::test]
    async fn terminal_choice_does_not_wait_for_done_or_connection_close() {
        let router = Router::new().route("/v1/chat/completions", post(|| async {
            let terminal = Bytes::from(format!("data: {}\n\n", json!({"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call-fast","type":"function","function":{"name":"ReadOutline","arguments":"{}"}}]},"finish_reason":"tool_calls"}]})));
            sse_response(futures_util::stream::once(async move { Ok(terminal) }).chain(futures_util::stream::pending()))
        }));
        let (model, server) = fixture_model(router).await;
        let (_sender, cancel) = watch::channel(false);
        let result = tokio::time::timeout(
            Duration::from_secs(2),
            complete(
                &model,
                vec![json!({"role":"user","content":"Read the outline"})],
                vec![],
                cancel,
            ),
        )
        .await;
        server.abort();
        let result = result
            .expect("terminal boundary must not wait on an open transport")
            .unwrap();
        assert_eq!(result.calls[0].id, "call-fast");
        assert_eq!(result.calls[0].arguments, "{}");
    }

    #[tokio::test]
    async fn tiny_provider_chunks_are_coalesced_without_losing_live_output() {
        let router = Router::new().route("/v1/chat/completions", post(|| async {
            sse_response(futures_util::stream::unfold(0usize, |index| async move {
                if index > 120 { return None; }
                tokio::time::sleep(Duration::from_millis(2)).await;
                let event = if index == 120 {
                    json!({"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]})
                } else {
                    json!({"choices":[{"index":0,"delta":{"content":"中"},"finish_reason":null}]})
                };
                Some((Ok(Bytes::from(format!("data: {event}\n\n"))), index+1))
            }))
        }));
        let (model, server) = fixture_model(router).await;
        let (_sender, cancel) = watch::channel(false);
        let observed = Arc::new(Mutex::new(Vec::new()));
        let collected = observed.clone();
        let started = Instant::now();
        let result = complete_streaming(
            &model,
            vec![json!({"role":"user","content":"test"})],
            vec![],
            cancel,
            move |events| {
                collected.lock().unwrap().push((started.elapsed(), events));
                // Match the observed per-transaction latency without invoking any provider.
                async {
                    tokio::time::sleep(Duration::from_millis(17)).await;
                    Ok(())
                }
            },
        )
        .await
        .unwrap();
        server.abort();
        assert_eq!(result.content, "中".repeat(120));
        let batches = observed.lock().unwrap();
        assert!(
            // Windows timer granularity can make each nominal 2ms server tick
            // approximately 16ms. Still require at least 3x fewer durable writes.
            batches.len() < 40,
            "token-sized chunks must not cause token-sized writes: {}",
            batches.len()
        );
        assert!(
            batches[0].0 < Duration::from_millis(250),
            "streaming must remain live"
        );
        let text: String = batches
            .iter()
            .flat_map(|(_, events)| events)
            .filter_map(|event| match event {
                StreamEvent::Text(text) => Some(text.as_str()),
                _ => None,
            })
            .collect();
        assert_eq!(text, result.content);
    }

    #[test]
    fn coalescing_preserves_changes_between_text_reasoning_and_tools() {
        let mut buffered = EventBuffer::default();
        buffered.append(vec![
            StreamEvent::Text("a".into()),
            StreamEvent::Text("b".into()),
            StreamEvent::Reasoning("r".into()),
            StreamEvent::Text("c".into()),
        ]);
        buffered.append(vec![
            StreamEvent::Tool {
                index: 0,
                id: "one".into(),
                name: "ReadOutline".into(),
                arguments: "{".into(),
            },
            StreamEvent::Tool {
                index: 0,
                id: "one".into(),
                name: "ReadOutline".into(),
                arguments: "}".into(),
            },
            StreamEvent::Tool {
                index: 1,
                id: "two".into(),
                name: "ReadSlide".into(),
                arguments: "{}".into(),
            },
        ]);
        let events = buffered.take();
        assert_eq!(events.len(), 5);
        assert!(matches!(&events[0], StreamEvent::Text(text) if text == "ab"));
        assert!(matches!(&events[1], StreamEvent::Reasoning(text) if text == "r"));
        assert!(matches!(&events[3], StreamEvent::Tool {arguments,..} if arguments == "{}"));
        assert_eq!(buffered.bytes, 0);
    }

    #[test]
    fn thinking_tool_turns_retain_provider_reasoning_for_the_next_request() {
        let mut parser = StreamParser::default();
        for delta in [
            json!({"reasoning_content":"read "}),
            json!({"reasoning_content":"first"}),
            json!({"tool_calls":[{"index":0,"id":"call","type":"function","function":{"name":"ReadOutline","arguments":"{}"}}]}),
        ] {
            parser
                .feed(
                    format!(
                        "data: {}\n\n",
                        json!({"choices":[{"index":0,"delta":delta}]})
                    )
                    .as_bytes(),
                )
                .unwrap();
        }
        parser.feed(b"data: {\"choices\":[{\"index\":0,\"delta\":{},\"finish_reason\":\"tool_calls\"}]}\n\n").unwrap();
        let result = parser.finish().unwrap();
        assert_eq!(result.message()["reasoning_content"], "read first");
        assert_eq!(result.message()["tool_calls"][0]["id"], "call");
        let direct = parse_json(br#"{"choices":[{"message":{"content":"ok","reasoning_content":"provider reasoning"},"finish_reason":"stop"}]}"#).unwrap();
        assert_eq!(direct.message()["reasoning_content"], "provider reasoning");
        assert_eq!(direct.visible_reasoning, "provider reasoning");
    }

    #[test]
    fn original_public_reasoning_aliases_never_reveal_encrypted_details() {
        for field in [
            "reasoning_content",
            "reasoningContent",
            "reasoning",
            "thinking",
            "thought",
        ] {
            let mut value = json!({});
            value[field] = json!("public");
            assert_eq!(visible_reasoning(&value).as_deref(), Some("public"));
        }
        assert_eq!(visible_reasoning(&json!({"reasoning_details":[{"type":"reasoning.encrypted","data":"opaque"},{"type":"reasoning.text","text":"one"},{"type":"reasoning.summary","summary":"two"}]})).as_deref(), Some("one\n\ntwo"));
        assert!(
            visible_reasoning(
                &json!({"reasoning_details":[{"type":"reasoning.encrypted","data":"opaque"}]})
            )
            .is_none()
        );
    }

    #[test]
    fn streaming_preserves_utf8_and_fragmented_tool_arguments() {
        let mut stream = String::new();
        for delta in [
            json!({"content":"你好"}),
            json!({"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"CreateOutline","arguments":"{\"markdown\":"}}]}),
            json!({"tool_calls":[{"index":0,"function":{"arguments":"\"标题\"}"}}]}),
        ] {
            stream.push_str(&format!(
                "data: {}\r\n\r\n",
                json!({"choices":[{"index":0,"delta":delta}]})
            ));
        }
        stream.push_str("data: [DONE]\n\n");
        let mut parser = StreamParser::default();
        for byte in stream.as_bytes() {
            parser.feed(&[*byte]).expect("fragment");
        }
        let result = parser.finish().expect("completion");
        assert_eq!(result.content, "你好");
        assert_eq!(result.calls[0].arguments, "{\"markdown\":\"标题\"}");
        assert_eq!(result.calls[0].name, "CreateOutline");
    }

    #[test]
    fn truncated_streams_never_execute_partial_tools() {
        let mut parser = StreamParser::default();
        parser
            .feed(b"data: {\"choices\":[{\"delta\":{\"content\":\"partial\"}}]}\n\n")
            .expect("valid event");
        assert_eq!(
            parser.finish().err().expect("must fail").code,
            "provider_protocol_error"
        );
        assert_eq!(
            parse_json(
                br#"{"choices":[{"message":{"content":"partial"},"finish_reason":"length"}]}"#
            )
            .err()
            .expect("must fail")
            .code,
            "provider_output_truncated"
        );
    }
}

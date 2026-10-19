//! OpenAI transport adapter for Otherone. Agent iteration and tools stay inside the SDK.
use super::text::{self, StreamEvent};
use crate::models::ResolvedModel;
use otherone::ai::{
    error::AiError,
    traits::{ExecutionFuture, ModelEvent, ModelEventStream, ModelExecutor},
    types::ChatResponse,
};
use serde_json::{Value, json};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::{mpsc, watch};

pub struct Executor {
    pub model: Arc<ResolvedModel>,
    pub cancellation: watch::Receiver<bool>,
    pub sdk_cancellation: tokio_util::sync::CancellationToken,
}

impl std::fmt::Debug for Executor {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("OpenAiSettingsExecutor")
    }
}

fn error(error: text::TextError) -> AiError {
    AiError::Execution {
        code: error.code.into(),
        message: error.message.into(),
    }
}

fn response(value: Value) -> Result<ModelEvent, text::TextError> {
    serde_json::from_value(value)
        .map(ModelEvent::Chunk)
        .map_err(|_| text::TextError {
            code: "provider_protocol_error",
            message: "The text provider returned an invalid completion",
        })
}

fn request_model(model: &ResolvedModel, config: &Value, has_tools: bool) -> ResolvedModel {
    let mut endpoint = model.endpoint.clone();
    if let Some(stream) = config["stream"].as_bool() {
        endpoint.options.stream = Some(stream);
    }
    endpoint.options.tool_choice = None;
    endpoint.options.extra_params.remove("tool_choice");
    if has_tools {
        if let Some(choice) = config.get("toolChoice") {
            endpoint
                .options
                .extra_params
                .insert("tool_choice".into(), choice.clone());
        }
        if let Some(parallel) = config["parallelToolCalls"].as_bool() {
            endpoint.options.parallel_tool_calls = Some(parallel);
        }
    } else {
        endpoint.options.parallel_tool_calls = None;
        endpoint.options.extra_params.remove("parallel_tool_calls");
    }
    ResolvedModel {
        endpoint,
        api_key: model.api_key.clone(),
    }
}

impl ModelExecutor for Executor {
    fn stream(&self, config: Value) -> ExecutionFuture<'_, ModelEventStream> {
        let model = self.model.clone();
        let cancellation = self.cancellation.clone();
        let sdk_cancellation = self.sdk_cancellation.clone();
        Box::pin(async move {
            let messages = config["messages"].as_array().cloned().unwrap_or_default();
            let tools = config["tools"].as_array().cloned().unwrap_or_default();
            let model = request_model(&model, &config, !tools.is_empty());
            let (sender, receiver) = mpsc::channel(32);
            tokio::spawn(async move {
                let mut identities = HashMap::<usize, (String, String)>::new();
                let request =
                    text::complete_streaming(&model, messages, tools, cancellation, |events| {
                        let sender = sender.clone();
                        let mut output = Vec::new();
                        for event in events {
                            let delta = match event {
                                StreamEvent::Text(content) => json!({"content":content}),
                                // Visible aliases are UI-only. Exact reasoning_content is attached once
                                // to the terminal message so another provider's alias is never invented.
                                StreamEvent::Reasoning(content) => json!({"reasoning":content}),
                                StreamEvent::Tool {
                                    index,
                                    id,
                                    name,
                                    arguments,
                                } => {
                                    let mut call =
                                        json!({"index":index,"function":{"arguments":arguments}});
                                    let previous = identities.entry(index).or_default();
                                    if previous.0 != id {
                                        // Original SDK replaces IDs, but appends function name deltas.
                                        call["id"] = json!(id);
                                        previous.0 = id;
                                        call["type"] = json!("function");
                                    }
                                    if let Some(suffix) = name
                                        .strip_prefix(previous.1.as_str())
                                        .filter(|suffix| !suffix.is_empty())
                                    {
                                        call["function"]["name"] = json!(suffix);
                                        previous.1 = name;
                                    }
                                    json!({"tool_calls":[call]})
                                }
                            };
                            output.push(response(json!({"choices":[{"index":0,"delta":delta}]})));
                        }
                        async move {
                            for event in output {
                                sender
                                    .send(event.map_err(error))
                                    .await
                                    .map_err(|_| text::TextError::cancelled())?;
                            }
                            Ok(())
                        }
                    });
                let completion = tokio::select! {
                    biased;
                    _ = sdk_cancellation.cancelled() => Err(text::TextError::cancelled()),
                    result = request => result,
                };
                match completion {
                    Ok(completion) => {
                        let terminal = response(
                            json!({"choices":[{"index":0,"message":{"reasoning_content":completion.reasoning_content},"finish_reason":if completion.calls.is_empty() {"stop"} else {"tool_calls"}}]}),
                        );
                        let _ = sender.send(terminal.map_err(error)).await;
                    }
                    Err(failure) => {
                        let _ = sender.send(Err(error(failure))).await;
                    }
                }
            });
            Ok(Box::pin(tokio_stream::wrappers::ReceiverStream::new(receiver)) as ModelEventStream)
        })
    }

    fn complete(&self, config: Value) -> ExecutionFuture<'_, ChatResponse> {
        Box::pin(async move {
            let messages = config["messages"].as_array().cloned().unwrap_or_default();
            let model = request_model(&self.model, &json!({"stream":false}), false);
            let completion = tokio::select! {
                biased;
                _ = self.sdk_cancellation.cancelled() => return Err(error(text::TextError::cancelled())),
                result = text::complete(&model, messages, Vec::new(), self.cancellation.clone()) => result.map_err(error)?,
            };
            serde_json::from_value(json!({"choices":[{"index":0,"message":completion.message(),"finish_reason":"stop"}]})).map_err(AiError::JsonError)
        })
    }
}

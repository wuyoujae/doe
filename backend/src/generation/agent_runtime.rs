//! The original Otherone loop with local Settings, SQLite tools and display protocol adapters.
use super::*;
use crate::{ai::agent_executor::Executor, generation::agent_history::History};
use otherone::agent::types::{
    AiOptions, ContextLoadType, InputOptions, RawChunkObserver, RawChunkObserverFuture, StorageType,
};
use otherone::ai::types::{Message, ProviderType};
use otherone::storage::types::RuntimeContext;
use otherone::tools::{
    ToolHandler, ToolRegistration, ToolRegistry,
    types::{ToolCallContext, ToolError, ToolErrorKind},
};
use otherone::{Otherone, PreCompactionMessageHook};
use std::sync::atomic::Ordering;
use tokio_util::sync::CancellationToken;

struct Execution {
    launch: RunLaunch,
    image_model: Arc<models::ResolvedModel>,
    revision: u64,
    selected: BTreeMap<String, String>,
    reads: editing::Reads,
    replacements: Vec<String>,
    history: Arc<History>,
    cancellation: watch::Receiver<bool>,
}

struct Handler {
    runner: Runner,
    state: Arc<tokio::sync::Mutex<Execution>>,
    name: String,
    cancellation: CancellationToken,
    failure: Arc<Mutex<Option<Failure>>>,
}

#[async_trait::async_trait]
impl ToolHandler for Handler {
    async fn call(&self, arguments: Value, context: ToolCallContext) -> Result<Value, ToolError> {
        let call = text::ToolCall {
            id: context.tool_call_id,
            name: self.name.clone(),
            arguments: arguments.to_string(),
        };
        let mut state = self.state.lock().await;
        match self
            .runner
            .execute_agent_tool(&mut state, call, arguments)
            .await
        {
            Ok(result) => Ok(result),
            Err(error) => {
                if let Ok(mut failure) = self.failure.lock() {
                    *failure = Some(error);
                }
                self.cancellation.cancel();
                Err(ToolError::new(
                    ToolErrorKind::Fatal,
                    "The fenced DOE operation could not continue",
                ))
            }
        }
    }
}

struct ObserverState {
    projection: streaming::Projection,
    calls: BTreeMap<usize, (String, String)>,
    round: usize,
}

struct Observer {
    runner: Runner,
    run: String,
    state: Mutex<ObserverState>,
}

impl Observer {
    async fn begin(&self) -> Result<(), String> {
        let round = {
            let mut state = self
                .state
                .lock()
                .map_err(|_| "agent_projection_unavailable")?;
            let round = state.round;
            state.projection = streaming::Projection::new(&self.run, round);
            state.calls.clear();
            state.round += 1;
            round
        };
        self.runner
            .event(
                &self.run,
                "model_request",
                &format!("DOE · model round {}", round + 1),
            )
            .await
            .map_err(|_| "agent_progress_write_failed".into())
    }
}

impl RawChunkObserver for Observer {
    fn observe_raw_chunk(&self, chunk: Value) -> RawChunkObserverFuture {
        let events: Result<Vec<(&'static str, Value)>, String> = (|| {
            let mut state = self
                .state
                .lock()
                .map_err(|_| "agent_projection_unavailable".to_string())?;
            let Some(choice) = chunk["choices"].get(0) else {
                return Ok(Vec::new());
            };
            let mut deltas = Vec::new();
            if let Some(delta) = choice.get("delta").filter(|value| value.is_object()) {
                if let Some(content) = delta["content"].as_str() {
                    deltas.push(text::StreamEvent::Text(content.into()));
                }
                if let Some(content) = delta["reasoning"].as_str() {
                    deltas.push(text::StreamEvent::Reasoning(content.into()));
                }
                for call in delta["tool_calls"].as_array().into_iter().flatten() {
                    let index = call["index"].as_u64().unwrap_or(0) as usize;
                    let identity = state.calls.entry(index).or_default();
                    if let Some(id) = call["id"].as_str() {
                        identity.0 = id.into();
                    }
                    if let Some(name) = call["function"]["name"].as_str() {
                        identity.1.push_str(name);
                    }
                    let arguments = call["function"]["arguments"].as_str().unwrap_or("");
                    deltas.push(text::StreamEvent::Tool {
                        index,
                        id: identity.0.clone(),
                        name: identity.1.clone(),
                        arguments: arguments.into(),
                    });
                }
            }
            let mut events = state.projection.accept(deltas);
            if choice["finish_reason"].is_string() {
                events.extend(state.projection.finish());
            }
            Ok(events)
        })();
        let runner = self.runner.clone();
        let run = self.run.clone();
        Box::pin(async move {
            runner
                .emit_events(&run, events?)
                .await
                .map_err(|_| "agent_stream_write_failed".into())
        })
    }
}

impl Runner {
    #[allow(clippy::too_many_arguments)]
    pub(super) async fn run_otherone(
        &self,
        launch: RunLaunch,
        text_model: models::ResolvedModel,
        image_model: models::ResolvedModel,
        revision: u64,
        system: String,
        definitions: Vec<Value>,
        history: Vec<Value>,
        selected: BTreeMap<String, String>,
        reads: editing::Reads,
        replacements: Vec<String>,
        attachment_context: Option<Value>,
        mut cancellation: watch::Receiver<bool>,
    ) -> Result<(), Failure> {
        let run = launch.run_id.clone();
        let stage = launch.stage;
        let history = History::new(self.projects.clone(), run.clone(), history);
        let image_model = Arc::new(image_model);
        let model = Arc::new(text_model);
        let initial_state = self.state(&launch, &image_model).await?;
        context::prepare_with_attachments(
            &system,
            &mut history.snapshot().await,
            initial_state,
            &selected,
            &definitions,
            &model.endpoint.options,
            attachment_context.as_ref(),
        )
        .map_err(|message| Failure::new("context_window_too_small", message))?;
        let attachment_reserved = attachment_context
            .as_ref()
            .map(context::estimate)
            .unwrap_or(0);
        let state = Arc::new(tokio::sync::Mutex::new(Execution {
            launch,
            image_model,
            revision,
            selected,
            reads,
            replacements,
            history: history.clone(),
            cancellation: cancellation.clone(),
        }));
        let token = CancellationToken::new();
        if *cancellation.borrow() {
            return Err(Failure::cancelled());
        }
        let cancellation_token = token.clone();
        let cancellation_bridge = tokio::spawn(async move {
            loop {
                if cancellation.changed().await.is_err() || *cancellation.borrow() {
                    cancellation_token.cancel();
                    break;
                }
            }
        });
        let observer = Arc::new(Observer {
            runner: self.clone(),
            run: run.clone(),
            state: Mutex::new(ObserverState {
                projection: streaming::Projection::new(&run, 0),
                calls: BTreeMap::new(),
                round: 0,
            }),
        });
        let failure = Arc::new(Mutex::new(None));
        let mut registry = ToolRegistry::new();
        let mut sdk_tools = Vec::new();
        for definition in &definitions {
            let definition: otherone::ai::types::Tool = serde_json::from_value(definition.clone())
                .map_err(|_| {
                    Failure::new(
                        "agent_tool_contract_invalid",
                        "A DOE tool definition is invalid",
                    )
                })?;
            let name = definition.function.name.clone();
            registry
                .register(ToolRegistration::new(
                    definition.clone(),
                    Arc::new(Handler {
                        runner: self.clone(),
                        state: state.clone(),
                        name,
                        cancellation: token.clone(),
                        failure: failure.clone(),
                    }),
                ))
                .map_err(|_| {
                    Failure::new(
                        "agent_tool_contract_invalid",
                        "A DOE tool definition is invalid",
                    )
                })?;
            sdk_tools.push(definition);
        }
        let resolver_runner = self.clone();
        let resolver_state = state.clone();
        let resolver_model = model.clone();
        let resolver_observer = observer.clone();
        let resolver_definitions = definitions.clone();
        let sdk_system = system.clone();
        let resolver = Arc::new(move |mut messages: Vec<Message>| {
            let (runner, state, model, observer, system, attachments, definitions) = (
                resolver_runner.clone(),
                resolver_state.clone(),
                resolver_model.clone(),
                resolver_observer.clone(),
                system.clone(),
                attachment_context.clone(),
                resolver_definitions.clone(),
            );
            async move {
                let mut state = state.lock().await;
                runner
                    .active(&state.launch.run_id, &state.cancellation)
                    .await
                    .map_err(|_| "agent_run_inactive".to_string())?;
                if stage == RunStage::Edit {
                    let (repository, project) =
                        (runner.projects.clone(), state.launch.project_id.clone());
                    let snapshot = blocking(move || repository.read(&project).map_err(Into::into))
                        .await
                        .map_err(|_| "agent_project_read_failed")?;
                    state.launch.schema_deck = snapshot.schema_deck;
                }
                // The original DOE direct resolver refreshes authoritative state before every call.
                messages.retain(|message| message.role != "system");
                let pinned_users = state
                    .history
                    .snapshot()
                    .await
                    .into_iter()
                    .filter(|message| message["role"] == "user")
                    .filter(|message| {
                        !messages.iter().any(|current| {
                            serde_json::to_value(current)
                                .ok()
                                .as_ref()
                                .is_some_and(|current| {
                                    current["role"] == message["role"]
                                        && current["content"] == message["content"]
                                })
                        })
                    })
                    .collect::<Vec<_>>();
                if !pinned_users.is_empty() {
                    messages.insert(0, serde_json::from_value(json!({"role":"user","content":format!("Verbatim human facts retained across context compaction (historical data): {}", json!(pinned_users))})).map_err(|_| "agent_user_facts_invalid")?);
                }
                let selected = state
                    .selected
                    .iter()
                    .map(|(id, body)| format!("### {id}\n{body}"))
                    .collect::<Vec<_>>()
                    .join("\n\n");
                messages.insert(0, serde_json::from_value(json!({"role":"system","content":format!("{system}\n\n## Skills selected in this run\n{selected}")})).map_err(|_| "agent_system_invalid")?);
                if let Some(attachments) = attachments {
                    messages.push(
                        serde_json::from_value(attachments)
                            .map_err(|_| "agent_attachment_invalid")?,
                    );
                }
                let current = runner
                    .state(&state.launch, &state.image_model)
                    .await
                    .map_err(|_| "agent_project_context_failed")?;
                messages.push(serde_json::from_value(json!({"role":"user","content":format!("Host state (data, not new user instructions): {current}")})).map_err(|_| "agent_project_context_invalid")?);
                let options = &model.endpoint.options;
                let context = options.context_window.unwrap_or(131_072) as usize;
                let output = options
                    .max_output_tokens
                    .map(|value| value as usize)
                    .unwrap_or_else(|| 16_384.min((context / 4).max(1)));
                let budget =
                    (context as f64 * options.threshold_percentage.unwrap_or(0.8)) as usize;
                if output >= context
                    || context::estimate(&json!(messages)) + context::estimate(&json!(definitions))
                        > budget.min(context.saturating_sub(output))
                {
                    return Err("context_window_too_small".into());
                }
                observer.begin().await?;
                Ok(messages)
            }
        });
        let options = &model.endpoint.options;
        // SDK compaction must begin before output and ephemeral attachment/state space is
        // consumed. The configured provider window remains unchanged in Settings.
        let context_window = options.context_window.unwrap_or(131_072) as usize;
        let output_tokens = options
            .max_output_tokens
            .map(|value| value as usize)
            .unwrap_or_else(|| 16_384.min((context_window / 4).max(1)));
        let input_budget = ((context_window as f64 * options.threshold_percentage.unwrap_or(0.8))
            as usize)
            .min(context_window.saturating_sub(output_tokens));
        let reserved = {
            let state = state.lock().await;
            let current = self.state(&state.launch, &state.image_model).await?;
            context::estimate(&current) + context::estimate(&json!(state.selected))
        };
        // Attachment context is counted by the resolver and preflight. Reserve its actual
        // size from the immutable source resolved before this SDK run started.
        let sdk_window = input_budget
            .saturating_sub(reserved + attachment_reserved)
            .max(1)
            .min(u32::MAX as usize) as u32;
        let input = InputOptions {
            session_id: run.clone(),
            context_load_type: ContextLoadType::LocalFile,
            storage_type: Some(StorageType::LocalFile),
            database_config: None,
            runtime_context: Some(
                RuntimeContext::new("local-owner").with_session_store(history.clone()),
            ),
            context_window: sdk_window,
            threshold_percentage: Some(1.0),
            max_iterations: Some(options.max_iterations.unwrap_or(8)),
            enable_long_term_memory: Some(false),
            long_term_memory_recall_max_types: None,
        };
        let executor = Arc::new(Executor {
            model: model.clone(),
            cancellation: state.lock().await.cancellation.clone(),
            sdk_cancellation: token.clone(),
        });
        let ai = AiOptions {
            provider: ProviderType::OpenAI,
            api_key: String::new(),
            base_url: model.endpoint.base_url.clone(),
            model: model.endpoint.model.clone(),
            user_prompt: None,
            user_message: None,
            system_prompt: Some(sdk_system),
            messages: None,
            context_length: None,
            temperature: options.temperature.map(|value| value as f32),
            top_p: options.top_p.map(|value| value as f32),
            tools: Some(sdk_tools),
            tool_registry: Some(Arc::new(registry)),
            terminal_tools: vec![
                "CreateOutline".into(),
                "ReplaceOutline".into(),
                "EditOutline".into(),
                "CreateDeck".into(),
            ],
            tools_realize: None,
            tool_choice: options
                .tool_choice
                .as_ref()
                .map(|value| otherone::ai::types::ToolChoice::String(value.clone())),
            required_terminal_tool: None,
            user_input_tool: Some("AskQuestions".into()),
            parallel_tool_calls: Some(false),
            stream: options.stream,
            other: None,
            message_resolver: Some(resolver),
            raw_chunk_observer: Some(observer),
            model_executor: Some(executor.clone()),
            compact_executor: Some(executor),
        };
        let mut handle =
            Otherone::invoke_agent_stream_interactive_with_cancellation_and_pre_compaction_hook(
                input,
                ai,
                None,
                token.clone(),
                Some(PreCompactionMessageHook::new(
                    crate::generation::doe_history_filter::filter,
                )),
            )
            .await
            .map_err(|_| {
                Failure::new(
                    "agent_runtime_start_failed",
                    "The Otherone runtime could not start",
                )
            })?;
        let mut runtime_error = None;
        while let Some(event) = handle.recv().await {
            if event.event_type == "error" {
                runtime_error = event.error.or(Some(event.content));
            }
        }
        let join = handle.wait().await;
        cancellation_bridge.abort();
        if let Some(error) = failure.lock().ok().and_then(|mut value| value.take()) {
            return Err(error);
        }
        if token.is_cancelled() {
            return Err(Failure::cancelled());
        }
        if join.is_err() {
            return Err(Failure::new(
                "agent_runtime_failed",
                "The Otherone runtime could not continue; saved work is preserved",
            ));
        }
        if let Some(error) = runtime_error {
            let code = if error.contains("context_window_too_small") {
                "context_window_too_small"
            } else if error.contains("Max iterations") {
                "agent_iteration_limit"
            } else {
                "text_provider_failed"
            };
            return Err(Failure::new(code, safe_runtime_error(&error)));
        }
        if history.terminal.load(Ordering::Acquire) {
            return Ok(());
        }
        if stage == RunStage::Edit {
            let (repository, run, saved) =
                (self.projects.clone(), run, json!(history.snapshot().await));
            blocking(move || repository.finish_edit(&run, &saved).map_err(Into::into)).await
        } else {
            Err(Failure::new(
                "agent_document_not_saved",
                "The model finished without saving a valid document; the saved project has been preserved",
            ))
        }
    }
}

fn safe_runtime_error(error: &str) -> &'static str {
    if error.contains("context_window_too_small") {
        "The configured context window cannot fit the DOE instructions, attachments and user facts; increase it in Settings and retry"
    } else if error.contains("Max iterations") {
        "The model did not complete within the configured maximum iterations. Saved work is preserved; adjust Settings or retry explicitly"
    } else {
        "The text model could not complete this run. Check the model settings or retry explicitly; saved work is preserved"
    }
}

impl Runner {
    async fn execute_agent_tool(
        &self,
        state: &mut Execution,
        call: text::ToolCall,
        arguments: Value,
    ) -> Result<Value, Failure> {
        self.active(&state.launch.run_id, &state.cancellation)
            .await?;
        let mut history = state.history.snapshot().await;
        if history
            .last()
            .and_then(|message| message["tool_calls"].as_array())
            .is_some_and(|calls| {
                calls.len() > 1
                    && calls.iter().any(|call| {
                        tools::is_barrier(call["function"]["name"].as_str().unwrap_or(""))
                    })
            })
        {
            let result = rejected(
                "Questions and document writes must be called alone. No tool in this batch was executed.",
            );
            self.emit_tool(&state.launch.run_id, &call, &result).await?;
            return Ok(result);
        }
        let terminal = state.history.terminal.clone();
        let revision = state.revision;
        let launch = &mut state.launch;
        let selected = &mut state.selected;
        let reads = &mut state.reads;
        let replacements = &mut state.replacements;
        let image_model = state.image_model.clone();
        let cancellation = state.cancellation.clone();
        let result = match call.name.as_str() {
            "ReadDoeSkill" => {
                let skill = arguments["skill"].as_str().filter(|_| {
                    arguments
                        .as_object()
                        .is_some_and(|object| object.len() == 1)
                });
                if let Some(skill) = skill {
                    match self.read_skill(revision, skill.into()).await? {
                        Some(content) => {
                            selected.insert(skill.into(), content.clone());
                            json!({"status":"ok","skill":skill,"revision":revision,"content":content})
                        }
                        None => rejected(
                            "This Skill is absent or disabled in the frozen catalog; choose an exact enabled id",
                        ),
                    }
                } else {
                    rejected("ReadDoeSkill accepts only the exact skill id")
                }
            }
            "ReadOutline"
                if arguments
                    .as_object()
                    .is_some_and(|object| object.is_empty()) =>
            {
                self.state(&launch, &image_model).await?
            }
            "AskQuestions" if matches!(launch.stage, RunStage::Outline | RunStage::Edit) => {
                match tools::questions(arguments.clone()) {
                    Ok(questions) => {
                        let result = json!({"status":"awaiting_user","requestId":launch.run_id,"questions":questions});
                        history.push(tool_result(&call, result.clone()));
                        let repository = self.projects.clone();
                        let id = launch.run_id.clone();
                        let saved = json!(history);
                        blocking(move || {
                            repository
                                .set_awaiting_answers(&id, questions, &saved)
                                .map_err(Into::into)
                        })
                        .await?;
                        self.emit_tool(&launch.run_id, &call, &result).await?;
                        terminal.store(true, std::sync::atomic::Ordering::Release);
                        return Ok(result);
                    }
                    Err(message) => rejected(&message),
                }
            }
            "CreateOutline" | "ReplaceOutline" | "EditOutline"
                if launch.stage == RunStage::Outline =>
            {
                let input = serde_json::from_value::<tools::OutlineInput>(arguments);
                match input {
                    Err(_) => rejected(
                        "Invalid Outline arguments; use markdown, visual_plan, and exact revision fields only when editing",
                    ),
                    Ok(input) => {
                        let bound = if call.name == "CreateOutline" {
                            launch.outline.is_none()
                                && input.outline_id.is_none()
                                && input.expected_revision.is_none()
                        } else {
                            input.outline_id.as_deref() == Some(launch.project_id.as_str())
                                && launch.outline.as_ref().is_some_and(|outline| {
                                    Some(outline.revision) == input.expected_revision
                                        && !outline.confirmed
                                })
                        };
                        if !bound {
                            rejected(
                                "The Outline identity or revision is stale; call ReadOutline and use ReplaceOutline/EditOutline for an existing draft",
                            )
                        } else {
                            let allowed = self.allowed(&launch.project_id).await?;
                            match validation::outline(
                                &input.markdown,
                                input.visual_plan.as_ref(),
                                &allowed,
                            ) {
                                Err(message) => rejected(&message),
                                Ok(document) => {
                                    let revision = launch
                                        .outline
                                        .as_ref()
                                        .map_or(1, |outline| outline.revision + 1);
                                    let result = json!({"status":"awaiting_confirmation","committed":true,"outline_id":launch.project_id,"revision":revision,"page_count":document["body"].as_array().map(Vec::len)});
                                    history.push(tool_result(&call, result.clone()));
                                    let repository = self.projects.clone();
                                    let id = launch.run_id.clone();
                                    let saved = json!(history);
                                    blocking(move || {
                                        repository
                                            .set_outline(&id, &input.markdown, &document, &saved)
                                            .map_err(Into::into)
                                    })
                                    .await?;
                                    self.emit_tool(&launch.run_id, &call, &result).await?;
                                    terminal.store(true, std::sync::atomic::Ordering::Release);
                                    return Ok(result);
                                }
                            }
                        }
                    }
                }
            }
            "ConfirmOutline" if launch.stage == RunStage::Slides => {
                if arguments["outline_id"] == launch.project_id
                    && launch.outline.as_ref().is_some_and(|outline| {
                        outline.confirmed && arguments["expected_revision"] == outline.revision
                    })
                {
                    json!({"status":"confirmed","committed":true,"already_confirmed":true,"outline_id":launch.project_id,"revision":launch.outline.as_ref().map(|outline|outline.revision)})
                } else {
                    rejected(
                        "Only the user's Confirm action can authorize slides; use the exact already-confirmed outline id and revision",
                    )
                }
            }
            "GenerateImage" if matches!(launch.stage, RunStage::Slides | RunStage::Edit) => {
                match serde_json::from_value::<tools::ImageInput>(arguments) {
                    Err(_) => rejected(
                        "Invalid GenerateImage arguments; use prompt, ratio and removeBackground",
                    ),
                    Ok(input) => {
                        let ratio = input.ratio.as_deref().unwrap_or("16:9");
                        if input.prompt.trim().is_empty()
                            || input.prompt.chars().count() > 16000
                            || !["1:1", "4:3", "3:4", "4:5", "16:9", "9:16"].contains(&ratio)
                        {
                            rejected(
                                "Use a prompt of 1..16000 characters and a supported aspect ratio",
                            )
                        } else if input.remove_background
                            && !images::supports_transparency(&image_model)
                        {
                            rejected(
                                "The configured image model does not support native transparency. Use an opaque image only if it satisfies the approved design, or ask the user to change the image model.",
                            )
                        } else {
                            let source = self
                                .image(
                                    &launch,
                                    &image_model,
                                    "tool",
                                    &input.prompt,
                                    ratio,
                                    input.remove_background,
                                    &cancellation,
                                )
                                .await?;
                            if !replacements.contains(&source) {
                                replacements.push(source.clone());
                            }
                            json!({"status":"succeeded","src":source,"asset_reference":source})
                        }
                    }
                }
            }
            "CreateDeck" if launch.stage == RunStage::Slides => {
                if arguments.get("deck_revision").is_none() {
                    rejected("CreateDeck requires deck_revision, using null when no deck exists")
                } else {
                    match serde_json::from_value::<tools::DeckInput>(arguments) {
                        Err(_) => rejected(
                            "Invalid CreateDeck arguments; supply complete Markdown and the exact revision fields",
                        ),
                        Ok(input) => {
                            let bound = input.outline_id == launch.project_id
                                && launch.outline.as_ref().is_some_and(|outline| {
                                    outline.confirmed && outline.revision == input.outline_revision
                                })
                                && launch.schema_deck.as_ref().map(|deck| deck.revision)
                                    == input.deck_revision;
                            if !bound {
                                rejected(
                                    "The confirmed Outline or Deck revision changed; read the current state before writing",
                                )
                            } else {
                                let outline = &launch
                                    .outline
                                    .as_ref()
                                    .ok_or_else(|| {
                                        Failure::new(
                                            "outline_confirmation_required",
                                            "Confirm the outline first",
                                        )
                                    })?
                                    .document;
                                let allowed = self.allowed(&launch.project_id).await?;
                                match validation::deck(
                                    &input.markdown,
                                    outline,
                                    &allowed,
                                    &replacements,
                                ) {
                                    Err(message) => rejected(&message),
                                    Ok(deck) => {
                                        self.active(&launch.run_id, &cancellation).await?;
                                        let result = json!({"status":"succeeded","committed":true,"slide_count":outline["body"].as_array().map(Vec::len)});
                                        history.push(tool_result(&call, result.clone()));
                                        self.checkpoint(&launch.run_id, &history).await?;
                                        let repository = self.projects.clone();
                                        let id = launch.run_id.clone();
                                        blocking(move || {
                                            repository.complete(&id, &deck).map_err(Into::into)
                                        })
                                        .await?;
                                        self.emit_tool(&launch.run_id, &call, &result).await?;
                                        terminal.store(true, std::sync::atomic::Ordering::Release);
                                        return Ok(result);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            "ReadSlide" if launch.stage == RunStage::Edit => match launch.schema_deck.as_ref() {
                Some(deck) => reads
                    .read(deck, arguments)
                    .unwrap_or_else(|error| rejected(&error)),
                None => rejected("No saved deck exists"),
            },
            "EditSlide" | "SetDeckTheme" if launch.stage == RunStage::Edit => {
                let current = launch
                    .schema_deck
                    .as_ref()
                    .ok_or_else(|| Failure::new("deck_missing", "The saved deck is unavailable"))?;
                let candidate = if call.name == "EditSlide" {
                    reads
                        .prepare(current, arguments)
                        .map(|(deck, id)| (deck, Some(id)))
                } else {
                    editing::theme(current, arguments).map(|deck| (deck, None))
                };
                match candidate {
                    Err(error) => rejected(&error),
                    Ok((deck, slide_id)) => {
                        let revision = current.revision;
                        let result = json!({"status":"succeeded","committed":true,"slideId":slide_id,"revision":revision+1});
                        let mut saved_history = history.clone();
                        saved_history.push(tool_result(&call, result.clone()));
                        let repository = self.projects.clone();
                        let run = launch.run_id.clone();
                        let call_id = call.id.clone();
                        let saved = json!(saved_history);
                        let snapshot = blocking(move || {
                            repository
                                .commit_edit(&run, revision, &deck, &saved, &call_id)
                                .map_err(Into::into)
                        })
                        .await?;
                        launch.schema_deck = snapshot.schema_deck;
                        result
                    }
                }
            }
            _ => rejected(
                "This tool is not available in the current stage. Use only the supplied tool definitions; outline confirmation belongs to the human user.",
            ),
        };
        self.emit_tool(&launch.run_id, &call, &result).await?;
        Ok(result)
    }
}

//! DOE host lifecycle and fenced tools. Otherone owns the actual Agent execution loop.
#[path = "agent_runtime.rs"]
mod agent_runtime;
use super::{attachments, context, editing, streaming, tools, validation};
use crate::{
    ai::{images, text},
    assets, doe, models,
    projects::{self, RunLaunch, RunStage},
};
use doe_document::presentation::outline::{image_placeholder, markdown as outline_markdown};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::{
    collections::{BTreeMap, HashMap},
    sync::{Arc, Mutex},
};
use tokio::sync::watch;

#[derive(Clone)]
pub struct Runner {
    projects: Arc<projects::Repository>,
    models: Arc<models::Repository>,
    doe: Arc<doe::Repository>,
    assets: Arc<assets::Repository>,
    cancellations: Arc<Mutex<HashMap<String, watch::Sender<bool>>>>,
}

struct Failure {
    code: &'static str,
    message: String,
}
impl Failure {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
    fn cancelled() -> Self {
        Self::new("cancelled", "Generation was cancelled")
    }
}
impl From<projects::Error> for Failure {
    fn from(error: projects::Error) -> Self {
        match error {
            projects::Error::Inactive => Self::cancelled(),
            projects::Error::Conflict => Self::new(
                "project_changed",
                "The project changed while generating; reload before retrying",
            ),
            _ => Self::new(
                "generation_storage_failed",
                "The project could not be saved; existing confirmed work has been preserved",
            ),
        }
    }
}
impl From<text::TextError> for Failure {
    fn from(error: text::TextError) -> Self {
        Self::new(error.code, error.message)
    }
}

async fn blocking<T: Send + 'static>(
    operation: impl FnOnce() -> Result<T, Failure> + Send + 'static,
) -> Result<T, Failure> {
    tokio::task::spawn_blocking(operation).await.map_err(|_| {
        Failure::new(
            "generation_internal_error",
            "Generation could not continue; saved work has been preserved",
        )
    })?
}

impl Runner {
    pub fn new(
        projects: Arc<projects::Repository>,
        models: Arc<models::Repository>,
        doe: Arc<doe::Repository>,
        assets: Arc<assets::Repository>,
    ) -> Self {
        Self {
            projects,
            models,
            doe,
            assets,
            cancellations: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn spawn(&self, launch: RunLaunch) {
        let runner = self.clone();
        let run_id = launch.run_id.clone();
        let (sender, cancellation) = watch::channel(false);
        {
            let Ok(mut pending) = self.cancellations.lock() else {
                return;
            };
            if pending.contains_key(&run_id) {
                return;
            }
            pending.insert(run_id.clone(), sender);
        }
        tokio::spawn(async move {
            let result = runner.run(launch, cancellation).await;
            if let Err(error) = result {
                let repository = runner.projects.clone();
                let id = run_id.clone();
                let _ = tokio::task::spawn_blocking(move || {
                    repository.fail(&id, error.code, &error.message)
                })
                .await;
            }
            if let Ok(mut pending) = runner.cancellations.lock() {
                pending.remove(&run_id);
            }
        });
    }

    pub fn cancel(&self, run_id: &str) {
        if let Ok(pending) = self.cancellations.lock() {
            if let Some(sender) = pending.get(run_id) {
                let _ = sender.send(true);
            }
        }
    }

    /// Work image generation has its own durable idempotency key and returns a pollable job.
    pub async fn generate_image(
        &self,
        project_id: String,
        input: assets::GenerateInput,
    ) -> Result<assets::ImageJob, projects::Error> {
        let repository = self.assets.clone();
        let project = project_id.clone();
        let request = input.clone();
        let (job, claimed) =
            tokio::task::spawn_blocking(move || repository.reserve_job(&project, &request))
                .await
                .map_err(projects::Error::internal)??;
        if claimed {
            let runner = self.clone();
            tokio::spawn(async move {
                let models = runner.models.clone();
                let model = tokio::task::spawn_blocking(move || models.resolve("image")).await;
                let (_sender, cancel) = watch::channel(false);
                let result = match model {
                    Ok(Ok(model)) => {
                        images::generate(
                            &model,
                            &input.prompt,
                            &input.ratio,
                            input.remove_background,
                            cancel,
                        )
                        .await
                    }
                    _ => Err(images::ImageError {
                        code: "image_model_not_configured",
                        message: "Configure a valid image model in Settings",
                        uncertain: false,
                    }),
                };
                let assets = runner.assets.clone();
                let _ = tokio::task::spawn_blocking(move || match result {
                    Ok(image) => {
                        match assets.store_generated(&project_id, &input.request_id, &image.bytes) {
                            Ok(_) => Ok(()),
                            Err(error) => {
                                let _ = assets.fail_job(
                                    &project_id,
                                    &input.request_id,
                                    "image_storage_failed",
                                    true,
                                );
                                Err(error)
                            }
                        }
                    }
                    Err(error) => {
                        assets.fail_job(&project_id, &input.request_id, error.code, error.uncertain)
                    }
                })
                .await;
            });
        }
        Ok(job)
    }

    async fn run(
        &self,
        mut launch: RunLaunch,
        cancellation: watch::Receiver<bool>,
    ) -> Result<(), Failure> {
        let repository = self.projects.clone();
        let id = launch.run_id.clone();
        if !blocking(move || repository.claim(&id).map_err(Into::into)).await? {
            return Ok(());
        }
        self.active(&launch.run_id, &cancellation).await?;
        let model_repository = self.models.clone();
        let doe_repository = self.doe.clone();
        let (model_revision, text_model, image_model, config) = blocking(move || {
            let (revision, text, image) = model_repository.resolve_pair().map_err(|_| {
                Failure::new(
                    "model_settings_unavailable",
                    "The model settings could not be loaded; check Settings",
                )
            })?;
            let config = doe_repository.resolve().map_err(|_| {
                Failure::new(
                    "doe_settings_unavailable",
                    "The DOE configuration could not be loaded; check Settings",
                )
            })?;
            Ok((revision, text, image, config))
        })
        .await?;
        if text_model.endpoint.model.is_empty() || text_model.endpoint.base_url.is_empty() {
            return Err(Failure::new(
                "text_model_not_configured",
                "Configure the text model in Settings, then retry this project",
            ));
        }
        if text_model.endpoint.options.tool_choice.as_deref() == Some("none") {
            return Err(Failure::new(
                "text_tools_disabled",
                "DOE requires tool calls; change Tool choice from None to Automatic or Required in Settings",
            ));
        }
        let frozen = json!({"agentRuntime":"otherone-agent/0.6.0-yrkie.1","modelRevision":model_revision,"text":text_model.endpoint,"image":image_model.endpoint,"doeRevision":config.revision,"systemPrompt":config.system_prompt,"outlineSchema":config.outline_schema,"slideSchema":config.slide_schema,"skills":config.skills});
        let repository = self.projects.clone();
        let id = launch.run_id.clone();
        blocking(move || repository.freeze_config(&id, &frozen).map_err(Into::into)).await?;

        let mut history = launch.history.as_array().cloned().unwrap_or_default();
        history.retain(|message| message["role"] != "system");
        if history.is_empty() {
            history.push(json!({"role":"user","content":launch.prompt}));
        }
        if let Some(instruction) = &launch.instruction {
            if !history.last().is_some_and(|message| {
                message["role"] == "user" && message["content"] == *instruction
            }) {
                history.push(json!({"role":"user","content":instruction}));
            }
        }
        let mut selected = BTreeMap::new();
        for id in context::selected_skill_ids(&history) {
            if let Some(content) = self.read_skill(config.revision, id.clone()).await? {
                selected.insert(id, content);
            }
        }
        // Replace old Skill read results with the current run's frozen revision, never mix versions.
        for message in &mut history {
            if message["role"] == "tool" {
                if let Some(mut result) = message["content"]
                    .as_str()
                    .and_then(|content| serde_json::from_str::<Value>(content).ok())
                {
                    if let Some(id) = result["skill"].as_str().map(str::to_owned) {
                        result["content"] = selected
                            .get(&id)
                            .map_or(Value::Null, |content| json!(content));
                        result["revision"] = json!(config.revision);
                        message["content"] = json!(result.to_string());
                    }
                }
            }
        }
        let attachment_dir = self
            .projects
            .path
            .parent()
            .ok_or_else(|| {
                Failure::new(
                    "attachment_storage_unavailable",
                    "The attachment directory is unavailable",
                )
            })?
            .to_path_buf();
        let attachment_project = launch.project_id.clone();
        let attachment_options = text_model.endpoint.options.clone();
        let attachment_context = blocking(move || {
            attachments::resolve(&attachment_dir, &attachment_project, &attachment_options).map_err(
                |error| {
                    Failure::new(
                        if error.code == "attachment_context_too_large" {
                            "attachment_context_too_large"
                        } else {
                            "attachments_unavailable"
                        },
                        error.message,
                    )
                },
            )
        })
        .await?;
        let system = context::system(&config, launch.stage);
        let definitions = tools::definitions(launch.stage);
        if launch.stage == RunStage::Slides {
            if !launch
                .outline
                .as_ref()
                .is_some_and(|outline| outline.confirmed)
            {
                return Err(Failure::new(
                    "outline_confirmation_required",
                    "Review and confirm the outline before generating slides",
                ));
            }
            // Check configuration before a potentially charged image request. The estimate uses
            // the final reference length, not verbose image prompts that leave model context.
            let mut estimated_state = self.state(&launch, &image_model).await?;
            if let Some(mut outline) = launch.outline.clone() {
                let plans = image_placeholder::scan(&outline.document).map_err(|_| {
                    Failure::new(
                        "outline_images_invalid",
                        "The confirmed outline contains an invalid image plan",
                    )
                })?;
                for plan in plans {
                    image_placeholder::replace_source(
                        &mut outline.document,
                        &plan.json_pointer,
                        &plan.source,
                        &format!("yrkie-asset-data://{}", "0".repeat(64)),
                    )
                    .map_err(|_| {
                        Failure::new(
                            "outline_images_invalid",
                            "The confirmed outline contains an invalid image plan",
                        )
                    })?;
                }
                outline.markdown =
                    outline_markdown::serialize(&outline.document).map_err(|_| {
                        Failure::new(
                            "outline_images_invalid",
                            "The confirmed outline could not be read",
                        )
                    })?;
                estimated_state["outline"] = json!(outline);
            }
            context::prepare_with_attachments(
                &system,
                &mut history.clone(),
                estimated_state,
                &selected,
                &definitions,
                &text_model.endpoint.options,
                attachment_context.as_ref(),
            )
            .map_err(|message| Failure::new("context_window_too_small", message))?;
            self.materialize(&mut launch, &image_model, &cancellation)
                .await?;
        }
        let allowed = self.allowed(&launch.project_id).await?;
        let reads = editing::Reads::default();
        let replacements = history
            .iter()
            .filter(|message| message["role"] == "tool")
            .filter_map(|message| {
                message["content"]
                    .as_str()
                    .and_then(|content| serde_json::from_str::<Value>(content).ok())
            })
            .filter(|receipt| receipt["status"] == "succeeded")
            .filter_map(|receipt| receipt["src"].as_str().map(str::to_owned))
            .filter(|source| allowed.contains(source))
            .collect::<Vec<_>>();
        self.run_otherone(
            launch,
            text_model,
            image_model,
            config.revision,
            system,
            definitions,
            history,
            selected,
            reads,
            replacements,
            attachment_context,
            cancellation,
        )
        .await
    }

    async fn materialize(
        &self,
        launch: &mut RunLaunch,
        model: &models::ResolvedModel,
        cancel: &watch::Receiver<bool>,
    ) -> Result<(), Failure> {
        let mut outline = launch.outline.clone().ok_or_else(|| {
            Failure::new("outline_confirmation_required", "Confirm the outline first")
        })?;
        let plans = image_placeholder::scan(&outline.document).map_err(|_| {
            Failure::new(
                "outline_images_invalid",
                "The confirmed outline contains an invalid image plan",
            )
        })?;
        for (index, plan) in plans.iter().enumerate() {
            self.emit_events(&launch.run_id,vec![("progress",json!({"messageId":launch.run_id,"itemId":format!("outline-image-{index}"),"phase":"image","current":index+1,"total":plans.len(),"status":"running"}))]).await?;
            self.event(
                &launch.run_id,
                "image_generation",
                &format!("Preparing outline image {} of {}", index + 1, plans.len()),
            )
            .await?;
            let source = self
                .image(
                    launch,
                    model,
                    &format!("outline:{}:{}", outline.revision, plan.json_pointer),
                    &plan.prompt,
                    &plan.ratio,
                    plan.image_type.as_str() == "content",
                    cancel,
                )
                .await?;
            self.active(&launch.run_id, cancel).await?;
            image_placeholder::replace_source(
                &mut outline.document,
                &plan.json_pointer,
                &plan.source,
                &source,
            )
            .map_err(|_| {
                Failure::new(
                    "outline_changed",
                    "The outline changed while preparing its images",
                )
            })?;
            outline.markdown = outline_markdown::serialize(&outline.document).map_err(|_| {
                Failure::new(
                    "outline_images_invalid",
                    "The prepared outline could not be saved",
                )
            })?;
            let repository = self.projects.clone();
            let id = launch.run_id.clone();
            let document = outline.document.clone();
            let markdown = outline.markdown.clone();
            blocking(move || {
                repository
                    .materialize_outline(&id, &document, &markdown)
                    .map_err(Into::into)
            })
            .await?;
            launch.outline = Some(outline.clone());
            self.emit_events(&launch.run_id,vec![("progress",json!({"messageId":launch.run_id,"itemId":format!("outline-image-{index}"),"phase":"image","current":index+1,"total":plans.len(),"status":"completed"}))]).await?;
        }
        Ok(())
    }

    async fn image(
        &self,
        launch: &RunLaunch,
        model: &models::ResolvedModel,
        identity: &str,
        prompt: &str,
        ratio: &str,
        remove_background: bool,
        cancel: &watch::Receiver<bool>,
    ) -> Result<String, Failure> {
        self.active(&launch.run_id, cancel).await?;
        let prefix = format!(
            "doe_{:x}_",
            Sha256::digest(
                json!([identity, prompt, ratio, remove_background])
                    .to_string()
                    .as_bytes()
            )
        );
        let repository = self.assets.clone();
        let project = launch.project_id.clone();
        let query = prefix.clone();
        if let Some(job) = blocking(move || {
            repository
                .find_succeeded_by_prefix(&project, &query)
                .map_err(Into::into)
        })
        .await?
        {
            if let Some(id) = job.asset_id {
                return Ok(format!("yrkie-asset-data://{id}"));
            }
        }
        let request = assets::GenerateInput {
            request_id: format!("{prefix}{}", launch.run_id),
            prompt: prompt.into(),
            ratio: ratio.into(),
            remove_background,
        };
        let repository = self.assets.clone();
        let project = launch.project_id.clone();
        let input = request.clone();
        let (job, claimed) =
            blocking(move || repository.reserve_job(&project, &input).map_err(Into::into)).await?;
        if !claimed {
            if job.state == "succeeded" {
                if let Some(id) = job.asset_id {
                    return Ok(format!("yrkie-asset-data://{id}"));
                }
            }
            return Err(Failure::new(
                "image_request_not_replayed",
                "An image request with this identity already failed or has an uncertain outcome. It was not sent again automatically; use the project's explicit retry action.",
            ));
        }
        let image =
            match images::generate(model, prompt, ratio, remove_background, cancel.clone()).await {
                Ok(image) => image,
                Err(error) => {
                    let repository = self.assets.clone();
                    let project = launch.project_id.clone();
                    let request_id = request.request_id.clone();
                    let code = error.code;
                    let uncertain = error.uncertain;
                    blocking(move || {
                        repository
                            .fail_job(&project, &request_id, code, uncertain)
                            .map_err(Into::into)
                    })
                    .await?;
                    return Err(Failure::new(error.code, error.message));
                }
            };
        let repository = self.assets.clone();
        let project = launch.project_id.clone();
        let run = launch.run_id.clone();
        let request_id = request.request_id.clone();
        let stored = blocking(move || {
            repository
                .store_for_run(&project, &request_id, &image.bytes, "generate", &run)
                .map_err(Into::into)
        })
        .await;
        let job = match stored {
            Ok(job) => job,
            Err(error) => {
                let repository = self.assets.clone();
                let project = launch.project_id.clone();
                let request_id = request.request_id.clone();
                let _ = blocking(move || {
                    repository
                        .fail_job(&project, &request_id, "image_storage_failed", true)
                        .map_err(Into::into)
                })
                .await;
                return Err(error);
            }
        };
        job.asset_id
            .map(|id| format!("yrkie-asset-data://{id}"))
            .ok_or_else(|| {
                Failure::new(
                    "image_storage_failed",
                    "The generated image could not be saved",
                )
            })
    }

    async fn active(&self, run_id: &str, cancel: &watch::Receiver<bool>) -> Result<(), Failure> {
        if *cancel.borrow() {
            return Err(Failure::cancelled());
        }
        let repository = self.projects.clone();
        let id = run_id.to_owned();
        if blocking(move || repository.is_active(&id).map_err(Into::into)).await? {
            Ok(())
        } else {
            Err(Failure::cancelled())
        }
    }

    async fn event(&self, run_id: &str, kind: &str, message: &str) -> Result<(), Failure> {
        let repository = self.projects.clone();
        let id = run_id.to_owned();
        let kind = kind.to_owned();
        let message = message.to_owned();
        blocking(move || repository.event(&id, &kind, &message).map_err(Into::into)).await
    }

    async fn emit_events(
        &self,
        run_id: &str,
        events: Vec<(&'static str, Value)>,
    ) -> Result<(), Failure> {
        if events.is_empty() {
            return Ok(());
        }
        let repository = self.projects.clone();
        let run = run_id.to_owned();
        blocking(move || {
            for batch in events.chunks(512) {
                repository.append_run_events(&run, batch)?;
            }
            Ok(())
        })
        .await
    }

    async fn emit_tool(
        &self,
        run_id: &str,
        call: &text::ToolCall,
        result: &Value,
    ) -> Result<(), Failure> {
        self.emit_events(run_id, vec![("tool_result", json!({"messageId":run_id,"itemId":call.id,"callId":call.id,"name":call.name,"result":result,"status":if result["status"] == "failed" { "failed" } else { "completed" }}))]).await
    }

    async fn checkpoint(&self, run_id: &str, history: &[Value]) -> Result<(), Failure> {
        let repository = self.projects.clone();
        let id = run_id.to_owned();
        let history = json!(history);
        blocking(move || repository.checkpoint(&id, &history).map_err(Into::into)).await
    }

    async fn read_skill(&self, revision: u64, id: String) -> Result<Option<String>, Failure> {
        let repository = self.doe.clone();
        blocking(move || {
            repository.read_skill(revision, &id).map_err(|_| {
                Failure::new(
                    "doe_settings_unavailable",
                    "The frozen DOE Skill could not be read",
                )
            })
        })
        .await
    }

    async fn allowed(&self, project_id: &str) -> Result<Vec<String>, Failure> {
        let repository = self.assets.clone();
        let id = project_id.to_owned();
        blocking(move || {
            repository
                .list(&id)
                .map(|assets| {
                    assets
                        .into_iter()
                        .map(|asset| asset.slide_reference)
                        .collect()
                })
                .map_err(Into::into)
        })
        .await
    }

    async fn state(
        &self,
        launch: &RunLaunch,
        image_model: &models::ResolvedModel,
    ) -> Result<Value, Failure> {
        let assets = self.allowed(&launch.project_id).await?;
        Ok(
            json!({"project_id":launch.project_id,"stage":launch.stage,"outline_id":launch.project_id,"outline":launch.outline,"outline_revision":launch.outline.as_ref().map(|outline|outline.revision),"confirmed":launch.outline.as_ref().is_some_and(|outline|outline.confirmed),"visual_plan":launch.outline.as_ref().and_then(|outline|outline.document.get("visual_plan")),"deck":launch.schema_deck.as_ref().map(editing::inventory).unwrap_or_else(|| json!({"revision":null})),"authorized_assets":assets,"image_model":{"configured":!image_model.endpoint.model.is_empty() && !image_model.endpoint.base_url.is_empty(),"supports_transparency":images::supports_transparency(image_model)}}),
        )
    }
}

fn rejected(message: &str) -> Value {
    json!({"status":"failed","committed":false,"error":message.chars().take(8000).collect::<String>(),"instruction":"Correct the uncommitted arguments and retry within the current tool budget. Do not claim success."})
}
fn tool_result(call: &text::ToolCall, result: Value) -> Value {
    json!({"role":"tool","tool_call_id":call.id,"content":result.to_string()})
}

use super::{validation, *};
use crate::db;
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde_json::json;
use std::path::{Path, PathBuf};

pub struct Repository {
    pub(crate) path: PathBuf,
}
impl Repository {
    pub fn open(data_dir: &Path) -> Result<Self, Error> {
        std::fs::create_dir_all(data_dir)?;
        let path = data_dir.join("yrkie.sqlite3");
        let mut connection = db::connect(&path)?;
        db::migrate(&mut connection).map_err(Error::internal)?;
        Ok(Self { path })
    }

    /// Called once during process startup, before accepting requests.
    pub fn recover_interrupted(&self) -> Result<(), Error> {
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let interrupted = {
            let mut query = tx.prepare("SELECT r.id,r.project_id FROM generation_runs r JOIN conversation_backfills b ON b.project_id=r.project_id WHERE r.status IN ('queued','running')")?;
            query
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<Result<Vec<_>, _>>()?
        };
        tx.execute("UPDATE projects SET status='failed',revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE latest_run_id IN (SELECT id FROM generation_runs WHERE status IN ('queued','running'))",[])?;
        tx.execute("UPDATE generation_runs SET status='interrupted',error_code='interrupted',message='Generation was interrupted. Retry to continue.',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE status IN ('queued','running')",[])?;
        tx.execute("UPDATE image_jobs SET state='uncertain',error_code='interrupted',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE state IN ('queued','processing')",[])?;
        for (run, project) in interrupted {
            conversation::append(
                &tx,
                &project,
                Some(&run),
                "run_failed",
                &json!({"status":"interrupted","errorCode":"interrupted","message":"Generation was interrupted. Retry to continue."}),
                None,
            )?;
        }
        tx.commit()?;
        Ok(())
    }
    pub fn read(&self, id: &str) -> Result<ProjectSnapshot, Error> {
        validation::project_id(id)?;
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction()?;
        let result = snapshot(&tx, id)?;
        tx.commit()?;
        Ok(result)
    }
    pub fn list(&self) -> Result<Vec<ProjectSummary>, Error> {
        let connection = db::connect(&self.path)?;
        let mut statement=connection.prepare("SELECT id,title,prompt,status,revision,created_at,updated_at FROM projects WHERE NOT EXISTS (SELECT 1 FROM project_requests r WHERE r.project_id=projects.id AND r.scope='browser_snapshot') ORDER BY updated_at DESC,id DESC LIMIT 500")?;
        Ok(statement
            .query_map([], |row| {
                Ok(ProjectSummary {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    prompt: row.get(2)?,
                    status: row.get(3)?,
                    revision: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?)
    }
    pub fn create(&self, request: CreateProject) -> Result<Mutation, Error> {
        validation::request_id(&request.request_id)?;
        validation::text(&request.prompt, 50_000)?;
        let digest = validation::hash(&serde_json::to_vec(&request)?);
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        if let Some(id) = replay(&tx, "create", &request.request_id, &digest)? {
            let result = mutation(&tx, &id, None, None)?;
            tx.commit()?;
            return Ok(result);
        }
        let id = format!("srv-{}", uuid::Uuid::new_v4());
        let title: String = request
            .prompt
            .trim()
            .lines()
            .next()
            .unwrap_or("Presentation")
            .chars()
            .take(160)
            .collect();
        tx.execute(
            "INSERT INTO projects(id,title,prompt,status) VALUES (?1,?2,?3,'running')",
            params![id, title, request.prompt.trim()],
        )?;
        let uploads = crate::attachments::attach_to_project(&tx, &id, &request.upload_ids)
            .map_err(|_| {
                Error::Invalid("Attachments must be ready and available before sending")
            })?;
        let run_id = insert_run(&tx, &id, RunStage::Outline, None, &json!([]), None, 0)?;
        conversation::append(
            &tx,
            &id,
            Some(&run_id),
            "user_message",
            &json!({"content":request.prompt.trim(),"action":"create","attachments":uploads}),
            None,
        )?;
        tx.execute(
            "INSERT INTO conversation_backfills(project_id) VALUES (?1)",
            [&id],
        )?;
        record(
            &tx,
            "create",
            &request.request_id,
            &digest,
            &id,
            Some(&run_id),
        )?;
        let result = mutation(&tx, &id, Some(run_id), None)?;
        tx.commit()?;
        Ok(result)
    }
    pub fn action(&self, id: &str, request: ProjectAction) -> Result<Mutation, Error> {
        validation::project_id(id)?;
        validation::request_id(&request.request_id)?;
        let digest = validation::hash(&serde_json::to_vec(&request)?);
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        if let Some(previous) = replay(&tx, id, &request.request_id, &digest)? {
            let result = mutation(&tx, &previous, None, None)?;
            tx.commit()?;
            return Ok(result);
        }
        let current = snapshot(&tx, id)?;
        if current.revision != request.expected_revision {
            return Err(Error::Conflict);
        }
        conversation::ensure_history(&tx, id)?;
        let active = current
            .run
            .as_ref()
            .is_some_and(|run| matches!(run.status.as_str(), "queued" | "running"));
        let mut cancelled = None;
        let mut launch = None;
        if !request.upload_ids.is_empty() && matches!(request.action, Action::Cancel) {
            return Err(Error::Invalid(
                "Attachments can only be sent with a message or answers",
            ));
        }
        if matches!(request.action, Action::Cancel) {
            let run = current
                .run
                .as_ref()
                .filter(|run| matches!(run.status.as_str(), "queued" | "running" | "questions"))
                .ok_or(Error::Invalid("There is no active generation to cancel"))?;
            tx.execute("UPDATE generation_runs SET status='cancelled',message='Generation cancelled.',error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",[&run.id])?;
            tx.execute("UPDATE projects SET status='cancelled',revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",[id])?;
            cancelled = Some(run.id.clone());
            conversation::append(
                &tx,
                id,
                Some(&run.id),
                "run_cancelled",
                &json!({"status":"cancelled","message":"Generation cancelled."}),
                None,
            )?;
        } else {
            if active {
                return Err(Error::Busy);
            }
            let uploads = crate::attachments::attach_to_project(&tx, id, &request.upload_ids)
                .map_err(|_| {
                    Error::Invalid("Attachments must be ready and available before sending")
                })?;
            let history = if let Some(run) = &current.run {
                read_history(&tx, &run.id)?
            } else {
                json!([])
            };
            let (stage, instruction) = match request.action {
                Action::Answer => {
                    let run = current
                        .run
                        .as_ref()
                        .filter(|run| run.status == "questions")
                        .ok_or(Error::Invalid("The project is not waiting for answers"))?;
                    let answers = request
                        .answers
                        .as_ref()
                        .ok_or(Error::Invalid("Answers are required"))?;
                    if answers.len() != run.questions.len() {
                        return Err(Error::Invalid("Answer every pending question"));
                    }
                    let mut seen = std::collections::HashSet::new();
                    for answer in answers {
                        if answer.answer.trim().is_empty()
                            || answer.answer.contains('\0')
                            || answer.answer.chars().count() > 5000
                        {
                            return Err(Error::Invalid(
                                "Answers must contain 1 to 5000 characters",
                            ));
                        }
                        if !seen.insert(&answer.id)
                            || !run
                                .questions
                                .iter()
                                .any(|question| question.id == answer.id)
                        {
                            return Err(Error::Invalid(
                                "Answers do not match the pending questions",
                            ));
                        }
                    }
                    (
                        run.stage,
                        Some(format!(
                            "User answers:\n{}",
                            serde_json::to_string(answers)?
                        )),
                    )
                }
                Action::Revise => {
                    if current.schema_deck.is_some()
                        || current
                            .outline
                            .as_ref()
                            .is_some_and(|outline| outline.confirmed)
                    {
                        return Err(Error::Invalid(
                            "A confirmed outline cannot be revised during slide generation",
                        ));
                    }
                    let message = request
                        .message
                        .as_deref()
                        .ok_or(Error::Invalid("Revision instructions are required"))?;
                    validation::text(message, 50_000)?;
                    let instruction = if let Some(source) = &request.outline_markdown {
                        validation::text(source, crate::doe::compiler::MAX_MARKDOWN_BYTES)?;
                        format!(
                            "{message}\n\nThe user supplied this edited outline as the source for the requested revision. It is not committed or confirmed yet:\n{source}"
                        )
                    } else {
                        message.to_owned()
                    };
                    (RunStage::Outline, Some(instruction))
                }
                Action::Chat => {
                    let deck = current.schema_deck.as_ref().ok_or(Error::Invalid(
                        "Generate a presentation before editing it through chat",
                    ))?;
                    if current.status == "questions" {
                        return Err(Error::Invalid(
                            "Answer the pending questions before sending another message",
                        ));
                    }
                    if request.expected_deck_revision != Some(deck.revision) {
                        return Err(Error::Conflict);
                    }
                    let message = request
                        .message
                        .as_deref()
                        .ok_or(Error::Invalid("A chat message is required"))?;
                    validation::text(message, 50_000)?;
                    (RunStage::Edit, Some(message.trim().into()))
                }
                Action::Confirm => {
                    let mut outline = current
                        .outline
                        .clone()
                        .filter(|outline| !outline.confirmed)
                        .ok_or(Error::Invalid("An unconfirmed outline is required"))?;
                    if current.status != "outline_ready" {
                        return Err(Error::Invalid("Wait for the outline before confirming"));
                    }
                    if let Some(markdown) = request
                        .outline_markdown
                        .as_ref()
                        .filter(|value| *value != &outline.markdown)
                    {
                        let plan = outline
                            .document
                            .get("visual_plan")
                            .filter(|value| !value.is_null())
                            .cloned()
                            .map(serde_json::from_value::<crate::generation::VisualPlan>)
                            .transpose()
                            .map_err(|_| Error::Invalid("The saved visual plan is invalid"))?;
                        let mut statement =
                            tx.prepare("SELECT asset_id FROM project_assets WHERE project_id=?1")?;
                        let allowed = statement
                            .query_map([id], |row| {
                                Ok(format!("yrkie-asset-data://{}", row.get::<_, String>(0)?))
                            })?
                            .collect::<Result<Vec<_>, _>>()?;
                        let document=crate::generation::validation::outline(markdown,plan.as_ref(),&allowed).map_err(|_|Error::Invalid("The edited outline does not match its DOE schema or visual plan; revise it before confirming"))?;
                        outline.markdown =
                            doe_document::presentation::outline::markdown::serialize(&document)
                                .map_err(|_| {
                                    Error::Invalid("The edited outline cannot be serialized")
                                })?;
                        outline.document = document;
                        outline.revision += 1;
                    }
                    outline.confirmed = true;
                    tx.execute(
                        "UPDATE projects SET outline_json=?2 WHERE id=?1",
                        params![id, serde_json::to_string(&outline)?],
                    )?;
                    (RunStage::Slides,Some("The user has explicitly confirmed this exact outline. Generate all slides from it.".into()))
                }
                Action::Retry => {
                    let run = current
                        .run
                        .as_ref()
                        .filter(|run| {
                            matches!(run.status.as_str(), "failed" | "cancelled" | "interrupted")
                        })
                        .ok_or(Error::Invalid(
                            "Only failed, interrupted or cancelled generations can be retried",
                        ))?;
                    (run.stage,Some("The user requested a retry. Continue from the committed project artifacts.".into()))
                }
                Action::Cancel => unreachable!(),
            };
            let updated = snapshot(&tx, id)?;
            let run_id = insert_run(
                &tx,
                id,
                stage,
                instruction.as_deref(),
                &history,
                updated.outline.as_ref().map(|outline| outline.revision),
                updated.schema_deck.as_ref().map_or(0, |deck| deck.revision),
            )?;
            tx.execute("UPDATE projects SET status='running',revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",[id])?;
            match request.action {
                Action::Answer => {
                    let previous = current.run.as_ref().ok_or(Error::Conflict)?;
                    conversation::append(
                        &tx,
                        id,
                        Some(&run_id),
                        "answers",
                        &json!({"requestId":previous.id,"questions":previous.questions,"answers":request.answers,"content":"","attachments":uploads}),
                        None,
                    )?;
                }
                Action::Revise | Action::Chat => conversation::append(
                    &tx,
                    id,
                    Some(&run_id),
                    "user_message",
                    &json!({"content":request.message.as_deref().unwrap_or("").trim(),"attachments":uploads,"action":if matches!(request.action,Action::Chat){"chat"}else{"revise"}}),
                    None,
                )?,
                Action::Confirm | Action::Retry => conversation::append(
                    &tx,
                    id,
                    Some(&run_id),
                    "user_message",
                    &json!({"content":"","attachments":uploads,"action":if matches!(request.action,Action::Confirm){"confirm"}else{"retry"}}),
                    None,
                )?,
                Action::Cancel => unreachable!(),
            }
            launch = Some(run_id);
        }
        record(&tx, id, &request.request_id, &digest, id, launch.as_deref())?;
        let result = mutation(&tx, id, launch, cancelled)?;
        tx.commit()?;
        Ok(result)
    }
    pub fn save_deck(&self, id: &str, request: SaveDeck) -> Result<SessionSchemaDeck, Error> {
        validation::project_id(id)?;
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let project = snapshot(&tx, id)?;
        let deck = project
            .schema_deck
            .ok_or(Error::Invalid("This project has no generated deck"))?;
        if deck.revision != request.expected_revision {
            // Recover a committed save whose response was lost, without skipping another edit.
            if request.expected_revision > 0
                && request.expected_revision.checked_add(1) == Some(deck.revision)
                && request.deck == deck.deck
            {
                tx.commit()?;
                return Ok(deck);
            }
            return Err(Error::Conflict);
        }
        if project
            .run
            .as_ref()
            .is_some_and(|run| matches!(run.status.as_str(), "queued" | "running"))
        {
            return Err(Error::Busy);
        }
        validation::deck(&tx, id, &request.deck)?;
        let title = deck_title(&request.deck, &project.title);
        tx.execute("UPDATE projects SET deck_json=?2,deck_revision=deck_revision+1,title=?3,revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![id,serde_json::to_string(&request.deck)?,title])?;
        let result = snapshot(&tx, id)?.schema_deck.ok_or(Error::NotFound)?;
        tx.commit()?;
        Ok(result)
    }
}

pub(crate) fn deck_title(deck: &Value, fallback: &str) -> String {
    deck.pointer("/deck/title")
        .and_then(Value::as_str)
        .filter(|s| !s.trim().is_empty())
        .unwrap_or(fallback)
        .trim()
        .chars()
        .take(160)
        .collect()
}
fn replay(
    connection: &Connection,
    scope: &str,
    id: &str,
    digest: &str,
) -> Result<Option<String>, Error> {
    let result:Option<(String,String)>=connection.query_row("SELECT project_id,request_sha256 FROM project_requests WHERE scope=?1 AND request_id=?2",params![scope,id],|row|Ok((row.get(0)?,row.get(1)?))).optional()?;
    match result {
        Some((project, stored)) if stored == digest => Ok(Some(project)),
        Some(_) => Err(Error::Idempotency),
        None => Ok(None),
    }
}
fn record(
    connection: &Connection,
    scope: &str,
    id: &str,
    digest: &str,
    project: &str,
    run: Option<&str>,
) -> Result<(), Error> {
    connection.execute("INSERT INTO project_requests(scope,request_id,request_sha256,project_id,run_id) VALUES (?1,?2,?3,?4,?5)",params![scope,id,digest,project,run])?;
    Ok(())
}
fn insert_run(
    connection: &Connection,
    project: &str,
    stage: RunStage,
    instruction: Option<&str>,
    history: &Value,
    outline_revision: Option<u64>,
    deck_revision: u64,
) -> Result<String, Error> {
    let id = uuid::Uuid::new_v4().to_string();
    let mut history = history
        .as_array()
        .cloned()
        .ok_or(Error::Invalid("Invalid model history"))?;
    if history.is_empty() {
        let prompt: String = connection.query_row(
            "SELECT prompt FROM projects WHERE id=?1",
            [project],
            |row| row.get(0),
        )?;
        history.push(json!({"role":"user","content":prompt}));
    }
    if let Some(instruction) = instruction {
        history.push(json!({"role":"user","content":instruction}));
    }
    let encoded = serde_json::to_string(&history)?;
    if encoded.len() > 16 * 1024 * 1024 {
        return Err(Error::Invalid(
            "The conversation exceeds the supported size",
        ));
    }
    connection.execute("INSERT INTO generation_runs(id,project_id,stage,status,instruction,history_json,outline_revision,deck_revision,mode) VALUES (?1,?2,?3,'queued',?4,?5,?6,?7,?8)",params![id,project,if stage==RunStage::Edit {"slides"}else{stage.as_str()},instruction,encoded,outline_revision,deck_revision,if stage==RunStage::Edit {"edit"}else{"generate"}])?;
    connection.execute(
        "UPDATE projects SET latest_run_id=?2 WHERE id=?1",
        params![project, id],
    )?;
    Ok(id)
}
fn mutation(
    connection: &Connection,
    id: &str,
    run: Option<String>,
    cancelled_run: Option<String>,
) -> Result<Mutation, Error> {
    let snapshot = snapshot(connection, id)?;
    let launch = if let Some(run_id) = run {
        let (stage, instruction): (String, Option<String>) = connection.query_row(
            "SELECT CASE WHEN mode='edit' THEN 'edit' ELSE stage END,instruction FROM generation_runs WHERE id=?1",
            [&run_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;
        Some(RunLaunch {
            history: read_history(connection, &run_id)?,
            run_id,
            project_id: id.into(),
            stage: parse_stage(&stage)?,
            prompt: snapshot.prompt.clone(),
            instruction,
            outline: snapshot.outline.clone(),
            schema_deck: snapshot.schema_deck.clone(),
        })
    } else {
        None
    };
    Ok(Mutation {
        snapshot,
        launch,
        cancelled_run,
    })
}
pub(crate) fn parse_stage(value: &str) -> Result<RunStage, Error> {
    match value {
        "outline" => Ok(RunStage::Outline),
        "slides" => Ok(RunStage::Slides),
        "edit" => Ok(RunStage::Edit),
        _ => Err(Error::internal("Invalid stored generation stage")),
    }
}
fn read_history(connection: &Connection, id: &str) -> Result<Value, Error> {
    let raw: String = connection.query_row(
        "SELECT history_json FROM generation_runs WHERE id=?1",
        [id],
        |row| row.get(0),
    )?;
    let mut history: Vec<Value> = serde_json::from_str(&raw)?;
    super::reasoning_history::restore(connection, id, &mut history)?;
    Ok(json!(history))
}

pub(crate) fn snapshot(connection: &Connection, id: &str) -> Result<ProjectSnapshot, Error> {
    let row=connection.query_row("SELECT id,title,prompt,status,revision,created_at,updated_at,outline_json,deck_json,deck_revision,latest_run_id FROM projects WHERE id=?1",[id],|row|Ok((row.get::<_,String>(0)?,row.get::<_,String>(1)?,row.get::<_,String>(2)?,row.get::<_,String>(3)?,row.get::<_,u64>(4)?,row.get::<_,String>(5)?,row.get::<_,String>(6)?,row.get::<_,Option<String>>(7)?,row.get::<_,Option<String>>(8)?,row.get::<_,u64>(9)?,row.get::<_,Option<String>>(10)?))).optional()?.ok_or(Error::NotFound)?;
    let mut outline: Option<OutlineSnapshot> =
        row.7.map(|raw| serde_json::from_str(&raw)).transpose()?;
    if let Some(outline) = outline.as_mut() {
        super::outline::ensure_page_ids(&mut outline.document, outline.revision);
    }
    let schema_deck = row
        .8
        .map(|raw| {
            Ok::<_, Error>(SessionSchemaDeck {
                session_id: id.into(),
                status: "active".into(),
                revision: row.9,
                created_at: row.5.clone(),
                updated_at: row.6.clone(),
                deck: serde_json::from_str(&raw)?,
            })
        })
        .transpose()?;
    let run = if let Some(run_id) = row.10 {
        let (stage,status,message,error_code,questions):(String,String,String,Option<String>,String)=connection.query_row("SELECT CASE WHEN mode='edit' THEN 'edit' ELSE stage END,status,message,error_code,questions_json FROM generation_runs WHERE id=?1",[&run_id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?)))?;
        let mut statement=connection.prepare("SELECT sequence,kind,message,created_at FROM (SELECT sequence,kind,message,created_at FROM generation_events WHERE run_id=?1 ORDER BY sequence DESC LIMIT 100) ORDER BY sequence")?;
        let events = statement
            .query_map([&run_id], |r| {
                Ok(RunEvent {
                    sequence: r.get(0)?,
                    kind: r.get(1)?,
                    message: r.get(2)?,
                    created_at: r.get(3)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Some(RunSnapshot {
            id: run_id,
            stage: parse_stage(&stage)?,
            status,
            message,
            error_code,
            questions: serde_json::from_str(&questions)?,
            events,
        })
    } else {
        None
    };
    Ok(ProjectSnapshot {
        id: row.0,
        title: row.1,
        prompt: row.2,
        status: row.3,
        revision: row.4,
        created_at: row.5,
        updated_at: row.6,
        outline,
        schema_deck,
        run,
    })
}

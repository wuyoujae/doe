use super::{
    repository::{deck_title, snapshot},
    validation, *,
};
use crate::db;
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};

impl Repository {
    /// Only the first dispatcher may own a queued run.
    pub fn claim(&self, id: &str) -> Result<bool, Error> {
        let connection = db::connect(&self.path)?;
        Ok(connection.execute("UPDATE generation_runs SET status='running',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1 AND status='queued' AND id=(SELECT latest_run_id FROM projects WHERE projects.id=generation_runs.project_id)",[id])?==1)
    }
    pub fn is_active(&self, id: &str) -> Result<bool, Error> {
        let connection = db::connect(&self.path)?;
        Ok(connection.query_row("SELECT 1 FROM generation_runs r JOIN projects p ON p.id=r.project_id AND p.latest_run_id=r.id WHERE r.id=?1 AND r.status IN ('queued','running')",[id],|_|Ok(())).optional()?.is_some())
    }
    pub fn freeze_config(&self, id: &str, value: &Value) -> Result<(), Error> {
        let encoded = serde_json::to_string(value)?;
        if encoded.len() > 4 * 1024 * 1024 {
            return Err(Error::Invalid("The run configuration is too large"));
        }
        // Callers must pass EndpointView, never a decrypted credential.
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        active_project(&tx, id)?;
        tx.execute(
            "UPDATE generation_runs SET config_json=coalesce(config_json,?2) WHERE id=?1",
            params![id, encoded],
        )?;
        tx.commit()?;
        Ok(())
    }
    pub fn checkpoint(&self, id: &str, history: &Value) -> Result<(), Error> {
        if !history.is_array() || serde_json::to_vec(history)?.len() > 16 * 1024 * 1024 {
            return Err(Error::Invalid(
                "The model history exceeds the supported limit",
            ));
        }
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        active_project(&tx, id)?;
        tx.execute("UPDATE generation_runs SET history_json=?2,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![id,serde_json::to_string(history)?])?;
        tx.commit()?;
        Ok(())
    }
    pub fn event(&self, id: &str, kind: &str, message: &str) -> Result<(), Error> {
        validation::request_id(kind)?;
        if message.len() > 2000 || message.contains('\0') {
            return Err(Error::Invalid("The progress message is too long"));
        }
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        active_project(&tx, id)?;
        let count: u32 = tx.query_row(
            "SELECT count(*) FROM generation_events WHERE run_id=?1",
            [id],
            |r| r.get(0),
        )?;
        if count >= 2000 {
            return Err(Error::Invalid("The generation event limit was reached"));
        }
        tx.execute("INSERT INTO generation_events(run_id,sequence,kind,message) SELECT ?1,coalesce(max(sequence),0)+1,?2,?3 FROM generation_events WHERE run_id=?1",params![id,kind,message])?;
        tx.execute("UPDATE generation_runs SET message=?2,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![id,message])?;
        tx.commit()?;
        Ok(())
    }
    pub fn set_awaiting_answers(
        &self,
        id: &str,
        questions: Vec<Question>,
        history: &Value,
    ) -> Result<(), Error> {
        validation::questions(&questions)?;
        validate_history(history)?;
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let project = active_project(&tx, id)?;
        tx.execute("UPDATE generation_runs SET status='questions',questions_json=?2,history_json=?3,message='Waiting for your answers.',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![id,serde_json::to_string(&questions)?,serde_json::to_string(history)?])?;
        transition(&tx, &project, "questions")?;
        conversation::append(
            &tx,
            &project,
            Some(id),
            "run_waiting",
            &serde_json::json!({"status":"questions","requestId":id}),
            None,
        )?;
        tx.commit()?;
        Ok(())
    }
    pub fn set_outline(
        &self,
        id: &str,
        markdown: &str,
        document: &Value,
        history: &Value,
    ) -> Result<(), Error> {
        validation::text(markdown, 2 * 1024 * 1024)?;
        validate_history(history)?;
        if !document.is_object() {
            return Err(Error::Invalid("The outline document must be an object"));
        }
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let project = active_project(&tx, id)?;
        let stage: String =
            tx.query_row("SELECT stage FROM generation_runs WHERE id=?1", [id], |r| {
                r.get(0)
            })?;
        let current = snapshot(&tx, &project)?;
        if stage != "outline"
            || current
                .outline
                .as_ref()
                .is_some_and(|outline| outline.confirmed)
        {
            return Err(Error::Conflict);
        }
        validation::validate_assets(&tx, &project, document)?;
        let mut outline = OutlineSnapshot {
            markdown: markdown.into(),
            document: document.clone(),
            revision: current.outline.map_or(1, |outline| outline.revision + 1),
            confirmed: false,
        };
        super::outline::ensure_page_ids(&mut outline.document, outline.revision);
        let title: String = document
            .get("title")
            .and_then(Value::as_str)
            .filter(|value| !value.trim().is_empty())
            .unwrap_or(&current.title)
            .trim()
            .chars()
            .take(160)
            .collect();
        tx.execute(
            "UPDATE projects SET outline_json=?2,title=?3 WHERE id=?1",
            params![project, serde_json::to_string(&outline)?, title],
        )?;
        tx.execute("UPDATE generation_runs SET status='completed',history_json=?2,questions_json='[]',message='Outline ready for confirmation.',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![id,serde_json::to_string(history)?])?;
        transition(&tx, &project, "outline_ready")?;
        conversation::append(
            &tx,
            &project,
            Some(id),
            "run_completed",
            &serde_json::json!({"status":"completed","stage":"outline"}),
            None,
        )?;
        tx.commit()?;
        Ok(())
    }
    pub fn materialize_outline(
        &self,
        id: &str,
        document: &Value,
        markdown: &str,
    ) -> Result<(), Error> {
        validation::text(markdown, 2 * 1024 * 1024)?;
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let project = active_project(&tx, id)?;
        let mut outline = snapshot(&tx, &project)?.outline.ok_or(Error::Conflict)?;
        let (stage, revision): (String, Option<u64>) = tx.query_row(
            "SELECT stage,outline_revision FROM generation_runs WHERE id=?1",
            [id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )?;
        if stage != "slides" || !outline.confirmed || revision != Some(outline.revision) {
            return Err(Error::Conflict);
        }
        validation::validate_assets(&tx, &project, document)?;
        outline.document = document.clone();
        outline.markdown = markdown.into();
        tx.execute("UPDATE projects SET outline_json=?2,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![project,serde_json::to_string(&outline)?])?;
        tx.commit()?;
        Ok(())
    }
    pub fn complete(&self, id: &str, deck: &Value) -> Result<(), Error> {
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let project = active_project(&tx, id)?;
        let current = snapshot(&tx, &project)?;
        let (stage, outline_revision, deck_revision): (String, Option<u64>, u64) = tx.query_row(
            "SELECT stage,outline_revision,deck_revision FROM generation_runs WHERE id=?1",
            [id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )?;
        if stage != "slides"
            || !current.outline.as_ref().is_some_and(|outline| {
                outline.confirmed && Some(outline.revision) == outline_revision
            })
            || current.schema_deck.as_ref().map_or(0, |deck| deck.revision) != deck_revision
        {
            return Err(Error::Conflict);
        }
        validation::deck(&tx, &project, deck)?;
        let outline_count = current
            .outline
            .as_ref()
            .and_then(|outline| outline.document.get("body"))
            .and_then(Value::as_array)
            .map(Vec::len);
        let slide_count = deck
            .pointer("/deck/slides")
            .and_then(Value::as_array)
            .map(Vec::len);
        if outline_count != slide_count {
            return Err(Error::Invalid(
                "Every confirmed outline page must have exactly one generated slide",
            ));
        }
        tx.execute(
            "UPDATE projects SET deck_json=?2,deck_revision=deck_revision+1,title=?3 WHERE id=?1",
            params![
                project,
                serde_json::to_string(deck)?,
                deck_title(deck, &current.title)
            ],
        )?;
        tx.execute("UPDATE generation_runs SET status='completed',message='Presentation ready.',error_code=NULL,questions_json='[]',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",[id])?;
        transition(&tx, &project, "ready")?;
        conversation::append(
            &tx,
            &project,
            Some(id),
            "deck_committed",
            &serde_json::json!({"revision":deck_revision+1}),
            None,
        )?;
        conversation::append(
            &tx,
            &project,
            Some(id),
            "run_completed",
            &serde_json::json!({"status":"completed","stage":"slides"}),
            None,
        )?;
        tx.commit()?;
        Ok(())
    }
    pub fn fail(&self, id: &str, code: &str, message: &str) -> Result<(), Error> {
        validation::request_id(code)?;
        if message.len() > 2000 {
            return Err(Error::Invalid("The failure message is too long"));
        }
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let project = match active_project(&tx, id) {
            Ok(project) => project,
            Err(Error::Inactive) => return Ok(()),
            Err(error) => return Err(error),
        };
        tx.execute("UPDATE generation_runs SET status='failed',error_code=?2,message=?3,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![id,code,message])?;
        transition(&tx, &project, "failed")?;
        conversation::append(
            &tx,
            &project,
            Some(id),
            "run_failed",
            &serde_json::json!({"status":"failed","message":message,"errorCode":code}),
            None,
        )?;
        tx.commit()?;
        Ok(())
    }
}
fn validate_history(history: &Value) -> Result<(), Error> {
    if !history.is_array() || serde_json::to_vec(history)?.len() > 16 * 1024 * 1024 {
        Err(Error::Invalid(
            "The model history exceeds the supported limit",
        ))
    } else {
        Ok(())
    }
}
pub(crate) fn active_project(connection: &Connection, id: &str) -> Result<String, Error> {
    connection.query_row("SELECT r.project_id FROM generation_runs r JOIN projects p ON p.id=r.project_id AND p.latest_run_id=r.id WHERE r.id=?1 AND r.status IN ('queued','running')",[id],|r|r.get(0)).optional()?.ok_or(Error::Inactive)
}
fn transition(connection: &Connection, project: &str, status: &str) -> Result<(), Error> {
    connection.execute("UPDATE projects SET status=?2,revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![project,status])?;
    Ok(())
}

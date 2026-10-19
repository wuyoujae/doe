//! AI slide edits share the editor's revision fence and preserve unrelated pages.
use super::{
    Error, ProjectSnapshot, Repository, conversation,
    repository::{deck_title, snapshot},
    runs::active_project,
    validation,
};
use crate::db;
use rusqlite::{OptionalExtension, TransactionBehavior, params};
use serde_json::{Value, json};

impl Repository {
    pub fn commit_edit(
        &self,
        run: &str,
        expected_revision: u64,
        deck: &Value,
        history: &Value,
        tool_call_id: &str,
    ) -> Result<ProjectSnapshot, Error> {
        // Provider tool IDs are opaque (unlike user request IDs).
        if tool_call_id.is_empty()
            || tool_call_id.len() > 256
            || tool_call_id.chars().any(char::is_control)
        {
            return Err(Error::Invalid("The tool call identity is invalid"));
        }
        if !history.is_array() || serde_json::to_vec(history)?.len() > 16 * 1024 * 1024 {
            return Err(Error::Invalid(
                "The model history exceeds the supported limit",
            ));
        }
        let hash = validation::hash(&serde_json::to_vec(
            &json!({"revision":expected_revision,"deck":deck}),
        )?);
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let project = active_project(&tx, run)?;
        if let Some(stored)=tx.query_row("SELECT request_sha256 FROM deck_edit_operations WHERE run_id=?1 AND tool_call_id=?2",params![run,tool_call_id],|r|r.get::<_,String>(0)).optional()? {
            if stored!=hash { return Err(Error::Idempotency); }
            let result=snapshot(&tx,&project)?; tx.commit()?; return Ok(result);
        }
        let (mode, revision): (String, u64) = tx.query_row(
            "SELECT mode,deck_revision FROM generation_runs WHERE id=?1",
            [run],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )?;
        let current = snapshot(&tx, &project)?;
        if mode != "edit"
            || revision != expected_revision
            || current.schema_deck.as_ref().map(|d| d.revision) != Some(expected_revision)
        {
            return Err(Error::Conflict);
        }
        validation::deck(&tx, &project, deck)?;
        tx.execute("UPDATE projects SET deck_json=?2,deck_revision=deck_revision+1,revision=revision+1,title=?3,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![project,serde_json::to_string(deck)?,deck_title(deck,&current.title)])?;
        tx.execute("UPDATE generation_runs SET deck_revision=deck_revision+1,history_json=?2,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![run,serde_json::to_string(history)?])?;
        tx.execute("INSERT INTO deck_edit_operations(run_id,tool_call_id,request_sha256,deck_revision) VALUES (?1,?2,?3,?4)",params![run,tool_call_id,hash,expected_revision+1])?;
        conversation::append(
            &tx,
            &project,
            Some(run),
            "deck_committed",
            &json!({"revision":expected_revision+1}),
            None,
        )?;
        let result = snapshot(&tx, &project)?;
        tx.commit()?;
        Ok(result)
    }
    pub fn finish_edit(&self, run: &str, history: &Value) -> Result<(), Error> {
        if !history.is_array() || serde_json::to_vec(history)?.len() > 16 * 1024 * 1024 {
            return Err(Error::Invalid(
                "The model history exceeds the supported limit",
            ));
        }
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let project = active_project(&tx, run)?;
        let mode: String =
            tx.query_row("SELECT mode FROM generation_runs WHERE id=?1", [run], |r| {
                r.get(0)
            })?;
        if mode != "edit" {
            return Err(Error::Conflict);
        }
        tx.execute("UPDATE generation_runs SET status='completed',history_json=?2,message='Presentation updated.',error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![run,serde_json::to_string(history)?])?;
        tx.execute("UPDATE projects SET status='ready',revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",[&project])?;
        conversation::append(
            &tx,
            &project,
            Some(run),
            "run_completed",
            &json!({"status":"completed","message":"Presentation updated."}),
            None,
        )?;
        tx.commit()?;
        Ok(())
    }
}

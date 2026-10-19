//! Autosave for the original outline cards. Page identities keep visual plans attached on reorder.
use super::{
    Error, OutlineSnapshot, ProjectSnapshot, Repository, SaveOutline, repository::snapshot,
    validation,
};
use crate::{db, generation::VisualPlan};
use doe_document::presentation::{
    outline::{image_placeholder, markdown},
    schema::contract,
};
use rusqlite::{TransactionBehavior, params};
use serde_json::{Value, json};
use std::collections::{HashMap, HashSet};

pub(crate) fn ensure_page_ids(document: &mut Value, revision: u64) {
    let Some(pages) = document.get_mut("body").and_then(Value::as_array_mut) else {
        return;
    };
    let mut used = HashSet::new();
    for (index, page) in pages.iter_mut().enumerate() {
        let Some(page) = page.as_object_mut() else {
            continue;
        };
        let existing = page
            .get("id")
            .and_then(Value::as_str)
            .filter(|id| !id.is_empty())
            .map(str::to_owned);
        if existing.as_ref().is_some_and(|id| used.insert(id.clone())) {
            continue;
        }
        let mut id = format!("outline-page-{revision}-{}", index + 1);
        while used.contains(&id) {
            id.push('-');
        }
        used.insert(id.clone());
        page.insert("id".into(), json!(id));
    }
}

impl Repository {
    pub fn save_outline(&self, id: &str, request: SaveOutline) -> Result<ProjectSnapshot, Error> {
        validation::project_id(id)?;
        if serde_json::to_vec(&request.document)?.len() > crate::doe::compiler::MAX_MARKDOWN_BYTES {
            return Err(Error::Invalid("The outline exceeds 2 MiB"));
        }
        let mut connection = db::connect(&self.path)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let current = snapshot(&tx, id)?;
        let stored = current
            .outline
            .as_ref()
            .ok_or(Error::Invalid("This project has no outline to edit"))?;
        if stored.confirmed {
            return Err(Error::Invalid(
                "The outline has been confirmed and can no longer be edited",
            ));
        }
        if current.status == "running"
            || current
                .run
                .as_ref()
                .is_some_and(|run| matches!(run.status.as_str(), "queued" | "running"))
        {
            return Err(Error::Busy);
        }
        let input = editable_document(&request.document)?;
        // Compare the same canonical form that is persisted, including after a lost response.
        let source = markdown::serialize(&input)
            .map_err(|_| Error::Invalid("The outline cards cannot be serialized"))?;
        let compiled = markdown::compile(&source)
            .map_err(|_| Error::Invalid("The outline cards do not match the DOE schema"))?;
        if !compiled.diagnostics.is_empty() {
            return Err(Error::Invalid("The outline contains unsupported syntax"));
        }
        let mut document = compiled.outline;
        let pages = input["body"]
            .as_array()
            .ok_or(Error::Invalid("The outline pages are invalid"))?;
        let body = document["body"]
            .as_array_mut()
            .ok_or(Error::Invalid("The compiled outline is invalid"))?;
        if body.len() != pages.len() {
            return Err(Error::Invalid(
                "The outline contains an empty or invalid page",
            ));
        }
        for (page, input) in body.iter_mut().zip(pages) {
            page["id"] = input["id"].clone();
        }
        let candidate = editable_document(&document)?;
        let existing = editable_document(&stored.document)?;
        if current.revision != request.expected_revision {
            if request.expected_revision > 0
                && request.expected_revision.checked_add(1) == Some(current.revision)
                && candidate == existing
            {
                tx.commit()?;
                return Ok(current);
            }
            return Err(Error::Conflict);
        }
        if candidate == existing {
            tx.commit()?;
            return Ok(current);
        }
        let old_pages = stored.document["body"]
            .as_array()
            .ok_or(Error::Invalid("The saved outline is invalid"))?;
        let previous = old_pages
            .iter()
            .enumerate()
            .map(|(index, page)| {
                Ok((
                    page["id"]
                        .as_str()
                        .ok_or(Error::Invalid("The saved page identity is invalid"))?,
                    index,
                ))
            })
            .collect::<Result<HashMap<_, _>, Error>>()?;
        if pages
            .iter()
            .any(|page| !previous.contains_key(page["id"].as_str().unwrap_or("")))
        {
            return Err(Error::Invalid(
                "An outline page identity changed; reload before saving",
            ));
        }

        validation::validate_assets(&tx, id, &document)?;
        let references = contract::collect_outline_image_sources(&document);
        if references
            .iter()
            .any(|source| !source.starts_with("yrkie-asset-data://"))
        {
            return Err(Error::Invalid(
                "Only this project's managed images may be used in an outline",
            ));
        }
        if let Some(plan) = stored
            .document
            .get("visual_plan")
            .filter(|value| !value.is_null())
        {
            let plan: VisualPlan = serde_json::from_value(plan.clone())
                .map_err(|_| Error::Invalid("The saved visual plan is invalid"))?;
            document["visual_plan"] =
                serde_json::to_value(remap_plan(plan, old_pages, pages, &document)?)?;
        }
        let markdown = markdown::serialize(&document)
            .map_err(|_| Error::Invalid("The outline could not be saved"))?;
        let outline = OutlineSnapshot {
            markdown,
            document,
            revision: stored.revision + 1,
            confirmed: false,
        };
        let title: String = outline.document["title"]
            .as_str()
            .filter(|title| !title.trim().is_empty())
            .unwrap_or(&current.title)
            .chars()
            .take(160)
            .collect();
        tx.execute("UPDATE projects SET outline_json=?2,title=?3,status='outline_ready',revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?1",params![id,serde_json::to_string(&outline)?,title])?;
        let result = snapshot(&tx, id)?;
        tx.commit()?;
        Ok(result)
    }
}

/// Only author-editable fields participate in replay detection; visual_plan is server-owned.
fn editable_document(document: &Value) -> Result<Value, Error> {
    let object = document
        .as_object()
        .ok_or(Error::Invalid("The outline must be an object"))?;
    if object.keys().any(|key| {
        !matches!(
            key.as_str(),
            "title" | "page_count" | "body" | "visual_plan"
        )
    }) {
        return Err(Error::Invalid("Unknown outline field"));
    }
    let title = document["title"]
        .as_str()
        .ok_or(Error::Invalid("An outline title is required"))?;
    let pages = document["body"]
        .as_array()
        .filter(|pages| !pages.is_empty() && pages.len() <= 200)
        .ok_or(Error::Invalid("An outline must keep at least one page"))?;
    let mut ids = HashSet::new();
    let mut body = Vec::with_capacity(pages.len());
    for (index, page) in pages.iter().enumerate() {
        let page = page
            .as_object()
            .ok_or(Error::Invalid("An outline page must be an object"))?;
        if page
            .keys()
            .any(|key| !matches!(key.as_str(), "id" | "index" | "page" | "contents"))
        {
            return Err(Error::Invalid("Unknown outline page field"));
        }
        let id = page
            .get("id")
            .and_then(Value::as_str)
            .filter(|id| !id.is_empty() && id.len() <= 128)
            .ok_or(Error::Invalid(
                "Every outline page needs its original identity",
            ))?;
        if !ids.insert(id) {
            return Err(Error::Invalid("Outline page identities must be unique"));
        }
        let contents = page
            .get("contents")
            .and_then(Value::as_array)
            .filter(|items| !items.is_empty())
            .ok_or(Error::Invalid("Every outline page needs content"))?;
        if contents.iter().any(|item| {
            !item
                .as_str()
                .is_some_and(|text| !text.contains('\0') && !text.trim().is_empty())
        }) {
            return Err(Error::Invalid("Outline content must be nonempty text"));
        }
        body.push(json!({"id":id,"index":index+1,"page":index+1,"contents":contents}));
    }
    Ok(json!({"title":title,"page_count":body.len(),"body":body}))
}

fn remap_plan(
    mut plan: VisualPlan,
    old_pages: &[Value],
    new_pages: &[Value],
    document: &Value,
) -> Result<VisualPlan, Error> {
    if plan.pages.len() != old_pages.len()
        || plan
            .pages
            .iter()
            .enumerate()
            .any(|(index, page)| page.page_number != index + 1)
    {
        return Err(Error::Invalid(
            "The saved visual plan does not match its pages",
        ));
    }
    let old_index: HashMap<_, _> = old_pages
        .iter()
        .enumerate()
        .filter_map(|(index, page)| page["id"].as_str().map(|id| (id, index)))
        .collect();
    let new_index: HashMap<_, _> = new_pages
        .iter()
        .enumerate()
        .filter_map(|(index, page)| page["id"].as_str().map(|id| (id, index)))
        .collect();
    let mut mapped = Vec::with_capacity(new_pages.len());
    for (index, page) in new_pages.iter().enumerate() {
        let previous = *old_index
            .get(page["id"].as_str().unwrap_or(""))
            .ok_or(Error::Invalid("Unknown outline page identity"))?;
        let mut visual = plan.pages[previous].clone();
        visual.page_number = index + 1;
        if let Some(source) = visual.source_page {
            let source_id = old_pages
                .get(source.wrapping_sub(1))
                .and_then(|page| page["id"].as_str())
                .ok_or(Error::Invalid("The saved image source page is invalid"))?;
            visual.source_page=Some(new_index.get(source_id).ok_or(Error::Invalid("This page supplies an image used by another page. Revise those image uses before deleting the source page"))?+1);
        }
        let source = visual.source_page.unwrap_or(index + 1);
        let source_page = document["body"]
            .get(source - 1)
            .ok_or(Error::Invalid("An image source page is missing"))?;
        let has_image = !contract::collect_outline_image_sources(source_page).is_empty()
            || !image_placeholder::scan(&json!({"body":[source_page]}))
                .map_err(|_| Error::Invalid("An image generation marker is invalid"))?
                .is_empty();
        // The original plan's role is immutable in the card editor; keep hidden image units intact.
        let role = serde_json::to_value(visual.role)?;
        if role == "native" {
            if visual.source_page.is_some() || has_image {
                return Err(Error::Invalid(
                    "A text-only page cannot acquire an image without revising its visual plan",
                ));
            }
        } else if !has_image {
            return Err(Error::Invalid(
                "A planned image is missing. Restore its hidden image content or revise the visual plan",
            ));
        }
        mapped.push(visual);
    }
    plan.pages = mapped;
    Ok(plan)
}

use super::{Error, MAX_DECK_BYTES, Question};
use rusqlite::{Connection, OptionalExtension};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::HashSet;

pub(crate) fn request_id(value: &str) -> Result<(), Error> {
    if value.len() > 128
        || value.is_empty()
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"-_:".contains(&byte))
    {
        return Err(Error::Invalid("A valid requestId is required"));
    }
    Ok(())
}
pub fn project_id(value: &str) -> Result<(), Error> {
    if !value.starts_with("srv-") || uuid::Uuid::parse_str(&value[4..]).is_err() {
        return Err(Error::NotFound);
    }
    Ok(())
}
pub(crate) fn text(value: &str, maximum: usize) -> Result<(), Error> {
    if value.trim().is_empty() || value.len() > maximum || value.contains('\0') {
        return Err(Error::Invalid(
            "Text is empty or exceeds the supported limit",
        ));
    }
    Ok(())
}
pub(crate) fn hash(value: &[u8]) -> String {
    format!("{:x}", Sha256::digest(value))
}
pub fn questions(items: &[Question]) -> Result<(), Error> {
    if items.is_empty() || items.len() > 4 {
        return Err(Error::Invalid("Questions must contain one to four items"));
    }
    let mut ids = HashSet::new();
    for item in items {
        if item.id.is_empty()
            || item.id.len() > 40
            || !item
                .id
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || b"_-".contains(&byte))
            || !ids.insert(&item.id)
        {
            return Err(Error::Invalid(
                "Question ids must be distinct ASCII letters, digits, underscores or hyphens (1..40 characters)",
            ));
        }
        if item.question.trim().is_empty()
            || item.question.chars().count() > 500
            || item.question.contains('\0')
        {
            return Err(Error::Invalid("Questions require 1..500 characters"));
        }
        if item.options.len() > 4 || item.options.len() == 1 {
            return Err(Error::Invalid(
                "Provide 2..4 options, or omit them for free text",
            ));
        }
        let mut labels = HashSet::new();
        for label in &item.options {
            if label.trim().is_empty()
                || label.chars().count() > 450
                || label.contains('\0')
                || !labels.insert(label.to_lowercase())
            {
                return Err(Error::Invalid(
                    "Options must be distinct nonempty text up to 450 characters",
                ));
            }
        }
    }
    Ok(())
}

pub(crate) fn deck(connection: &Connection, project: &str, value: &Value) -> Result<(), Error> {
    if serde_json::to_vec(value)?.len() > MAX_DECK_BYTES {
        return Err(Error::Invalid("The deck exceeds 8 MiB"));
    }
    if value.get("version").and_then(Value::as_u64) != Some(4) {
        return Err(Error::Invalid("Only DOE version 4 decks are supported"));
    }
    let slides = value
        .pointer("/deck/slides")
        .and_then(Value::as_array)
        .ok_or(Error::Invalid("The deck must contain slides"))?;
    if slides.is_empty() || slides.len() > 200 {
        return Err(Error::Invalid(
            "A deck must contain between 1 and 200 slides",
        ));
    }
    let mut ids = HashSet::new();
    for slide in slides {
        let id = slide
            .get("id")
            .and_then(Value::as_str)
            .ok_or(Error::Invalid("Every slide needs an identifier"))?;
        text(id, 128)?;
        if !ids.insert(id) {
            return Err(Error::Invalid("Slide identifiers must be unique"));
        }
        if !slide.get("blocks").is_some_and(Value::is_array) {
            return Err(Error::Invalid("Slide blocks must be an array"));
        }
        for dimension in ["width", "height"] {
            let size = slide
                .get("size")
                .and_then(|size| size.get(dimension))
                .and_then(Value::as_f64)
                .ok_or(Error::Invalid("Slide size is required"))?;
            if !(1.0..=10000.0).contains(&size) {
                return Err(Error::Invalid(
                    "Slide dimensions are outside the supported range",
                ));
            }
        }
        if slide.pointer("/size/unit").and_then(Value::as_str) != Some("pt") {
            return Err(Error::Invalid("Slide geometry must use points"));
        }
    }
    validate_assets(connection, project, value)
}

pub(crate) fn validate_assets(
    connection: &Connection,
    project: &str,
    value: &Value,
) -> Result<(), Error> {
    let mut stack = vec![(value, 0usize)];
    let mut nodes = 0;
    let mut assets = HashSet::new();
    while let Some((node, depth)) = stack.pop() {
        nodes += 1;
        if depth > 64 || nodes > 250_000 {
            return Err(Error::Invalid("The document structure is too large"));
        }
        match node {
            Value::String(source) if source.starts_with("yrkie-asset-data://") => {
                let id = &source[19..];
                if id.len() != 64
                    || !id
                        .bytes()
                        .all(|v| v.is_ascii_digit() || (b'a'..=b'f').contains(&v))
                {
                    return Err(Error::Invalid("Invalid managed image reference"));
                }
                assets.insert(id);
            }
            Value::Array(items) => stack.extend(items.iter().map(|item| (item, depth + 1))),
            Value::Object(items) => stack.extend(items.values().map(|item| (item, depth + 1))),
            _ => {}
        }
    }
    for asset in assets {
        if connection
            .query_row(
                "SELECT 1 FROM project_assets WHERE project_id=?1 AND asset_id=?2",
                rusqlite::params![project, asset],
                |_| Ok(()),
            )
            .optional()?
            .is_none()
        {
            return Err(Error::Invalid("An image does not belong to this project"));
        }
    }
    Ok(())
}

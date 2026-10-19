use super::{
    Entry, MAX_CONTENT_BYTES, MAX_ENTRY_BYTES, MAX_SKILL_BYTES, REQUIRED_IDS, SettingsError,
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::collections::BTreeSet;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Bundle {
    source_revision: String,
    source_date: String,
    entries: Vec<Resource>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Resource {
    id: String,
    kind: String,
    name: String,
    description: String,
    content: String,
    default_enabled: bool,
    source_path: String,
    content_sha256: String,
    format: String,
    #[serde(default)]
    theme_id: Option<Value>,
}

pub(super) fn load() -> Result<Vec<Entry>, SettingsError> {
    let bundle: Bundle = serde_json::from_str(include_str!(concat!(
        env!("OUT_DIR"),
        "/doe-resources.json"
    )))
    .map_err(SettingsError::internal)?;
    let mut ids = BTreeSet::new();
    let mut total = 0;
    let mut skill_count = 0;
    let mut entries = Vec::new();
    for resource in bundle.entries {
        let limit = if resource.kind == "skill" {
            skill_count += 1;
            MAX_SKILL_BYTES
        } else {
            MAX_ENTRY_BYTES
        };
        total += resource.content.len();
        if !ids.insert(resource.id.clone())
            || resource.id.is_empty()
            || resource.id.len() > 128
            || !resource
                .id
                .bytes()
                .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, b'.' | b'-' | b'_'))
            || !matches!(resource.kind.as_str(), "prompt" | "schema" | "skill")
            || resource.content.trim().is_empty()
            || resource.content.contains('\0')
            || resource.content.len() > limit
            || (resource.kind != "skill" && !resource.default_enabled)
        {
            return Err(SettingsError::internal("Invalid bundled DOE resource"));
        }
        entries.push(Entry {
            id: resource.id,
            kind: resource.kind,
            name: resource.name,
            description: resource.description,
            content: resource.content.clone(),
            default_content: resource.content,
            enabled: resource.default_enabled,
            default_enabled: resource.default_enabled,
            is_modified: false,
            source: json!({"revision":bundle.source_revision,"date":bundle.source_date,
                "path":resource.source_path,"contentSha256":resource.content_sha256,
                "format":resource.format,"themeId":resource.theme_id}),
        });
    }
    if total > MAX_CONTENT_BYTES
        || skill_count > 128
        || REQUIRED_IDS.iter().any(|id| !ids.contains(*id))
    {
        return Err(SettingsError::internal("Invalid bundled DOE resource set"));
    }
    Ok(entries)
}

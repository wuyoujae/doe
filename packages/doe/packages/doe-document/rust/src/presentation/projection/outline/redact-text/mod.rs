// Origin: app/backend/core/src/plugin_outline_markdown.rs::redact_text
use super::*;


pub(crate) fn redact_text(value: &str, internal_ids: &[&str]) -> String {
    let mut text = value.to_owned();
    for id in internal_ids.iter().filter(|id| !id.is_empty()) {
        text = text.replace(id, "[redacted]");
    }
    text = REFERENCES
        .replace_all(&text, "[reference omitted]")
        .into_owned();
    text.chars()
        .filter(|c| {
            (!c.is_control() || *c == '\n' || *c == '\t')
                && !matches!(c,'\u{202a}'..='\u{202e}'|'\u{2066}'..='\u{2069}')
        })
        .collect()
}

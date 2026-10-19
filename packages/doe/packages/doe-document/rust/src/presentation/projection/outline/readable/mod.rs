// Origin: app/backend/core/src/plugin_outline_markdown.rs::readable
use super::*;


pub(super) fn readable(value: &Value, out: &mut String, ids: &[&str], depth: usize) {
    if out.len() > 120000 {
        return;
    }
    if depth > 6 {
        out.push_str("\n[Nested content omitted]\n");
        return;
    }
    if let Some(text) = scalar(value, ids) {
        out.push_str(&format!("- {text}\n"));
    } else if let Some(items) = value.as_array() {
        for item in items {
            readable(item, out, ids, depth + 1);
        }
    } else if value.get("type").is_some() {
        body_text(value, out, ids, depth + 1);
    } else {
        // Nested record properties are semantic data only; identifiers, URLs and metadata are excluded.
        for field in [
            "title",
            "text",
            "label",
            "name",
            "value",
            "unit",
            "period",
            "comparison",
            "time",
            "detail",
            "order",
            "values",
        ] {
            if let Some(v) = value.get(field) {
                readable(v, out, ids, depth + 1);
            }
        }
    }
}

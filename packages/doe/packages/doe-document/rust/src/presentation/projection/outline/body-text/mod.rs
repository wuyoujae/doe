// Origin: app/backend/core/src/plugin_outline_markdown.rs::body_text
use super::*;


pub(super) fn body_text(value: &Value, out: &mut String, ids: &[&str], depth: usize) {
    if out.len() > 120000 {
        return;
    }
    if depth > 6 {
        out.push_str("\n[Nested content omitted]\n");
        return;
    }
    if let Some(text) = scalar(value, ids) {
        out.push_str(&format!("\n{text}\n"));
        return;
    }
    let Some(kind) = value.get("type").and_then(Value::as_str) else {
        out.push_str("\n[Unsupported content omitted]\n");
        return;
    };
    let fields: &[&str] = match kind {
        "text_block" => &["paragraphs"],
        "metric" => &["label", "value", "unit", "period", "comparison"],
        "metrics" | "strengths" | "illustrated_items" => &["items"],
        "timeline" => &["events"],
        "process" => &["steps"],
        "comparison" => &["dimensions", "items"],
        "table" => {
            table(value, out, ids);
            return;
        }
        "image" | "generated_image" => {
            out.push_str("\n[Image omitted]\n");
            return;
        }
        _ => {
            out.push_str("\n[Additional structured content omitted]\n");
            return;
        }
    };
    for field in fields {
        if let Some(v) = value.get(*field) {
            readable(v, out, ids, depth + 1);
        }
    }
}

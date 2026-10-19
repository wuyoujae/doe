// Origin: app/backend/core/src/plugin_outline_markdown.rs::safe_text
use super::*;


pub fn safe_text(value: &str, internal_ids: &[&str]) -> String {
    let mut out = String::new();
    for c in redact_text(value, internal_ids).chars() {
        match c {
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '&' => out.push_str("&amp;"),
            '\\' | '`' | '*' | '_' | '[' | ']' | '#' | '|' => {
                out.push('\\');
                out.push(c);
            }
            _ => out.push(c),
        }
    }
    out
}

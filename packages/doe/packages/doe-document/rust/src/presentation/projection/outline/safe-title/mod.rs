// Origin: app/backend/core/src/plugin_outline_markdown.rs::safe_title
use super::*;


pub fn safe_title(value: &str, ids: &[&str]) -> String {
    let text = safe_text(value, ids);
    if text.chars().count() > 4096 {
        format!("{}…", text.chars().take(4095).collect::<String>())
    } else {
        text
    }
}

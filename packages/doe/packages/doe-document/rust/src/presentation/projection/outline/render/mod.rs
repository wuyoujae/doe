// Origin: app/backend/core/src/plugin_outline_markdown.rs::render
use super::*;


pub fn render(title: &str, value: &Value, ids: &[&str]) -> Result<String, String> {
    page_count(value)?;
    let mut out = format!("# {title}\n");
    if let Some(pages) = value.get("slides").and_then(Value::as_array) {
        for (index, page) in pages.iter().enumerate() {
            out.push_str(&format!("\n## Page {}\n", index + 1));
            let items = page
                .get("contents")
                .and_then(Value::as_object)
                .ok_or("outline_unavailable")?;
            for item in items.values() {
                if let Some(body) = item.get("body") {
                    body_text(body, &mut out, ids, 0);
                }
                if let Some(describe) = item.get("describe").and_then(Value::as_str) {
                    out.push_str(&format!("\n{}\n", safe_text(describe, ids)));
                }
            }
        }
    } else {
        for (index, page) in value["body"]
            .as_array()
            .ok_or("outline_unavailable")?
            .iter()
            .enumerate()
        {
            out.push_str(&format!("\n## Page {}\n", index + 1));
            for item in page
                .get("contents")
                .and_then(Value::as_array)
                .ok_or("outline_unavailable")?
            {
                let text = item.as_str().ok_or("outline_unavailable")?;
                out.push_str(&format!("\n- {}\n", safe_text(text, ids)));
            }
        }
    }
    if out.len() > 120000 {
        return Err("outline_too_large".into());
    }
    Ok(out)
}

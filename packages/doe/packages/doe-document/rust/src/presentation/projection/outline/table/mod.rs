// Origin: app/backend/core/src/plugin_outline_markdown.rs::table
use super::*;


pub(super) fn table(value: &Value, out: &mut String, ids: &[&str]) {
    let (Some(columns), Some(rows)) = (
        value.get("columns").and_then(Value::as_array),
        value.get("rows").and_then(Value::as_array),
    ) else {
        return;
    };
    for row in rows {
        if out.len() > 120000 {
            return;
        }
        out.push('\n');
        for col in columns {
            let (Some(key), Some(label)) = (
                col.get("key").and_then(Value::as_str),
                col.get("label").and_then(Value::as_str),
            ) else {
                continue;
            };
            let field = key.replace('_', "").replace('-', "").to_ascii_lowercase();
            if [
                "id",
                "userid",
                "sessionid",
                "projectid",
                "outlineid",
                "slideid",
                "src",
                "url",
                "token",
                "secret",
                "storagepath",
                "apikey",
                "authorization",
            ]
            .contains(&field.as_str())
            {
                continue;
            }
            if let Some(text) = row.get(key).and_then(|v| scalar(v, ids)) {
                out.push_str(&format!("- {}: {text}\n", safe_text(label, ids)));
            }
        }
    }
}

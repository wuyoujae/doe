// Origin: app/backend/core/src/presentation_shares.rs::strip_private_fields
use super::*;


pub(super) fn strip_private_fields(value: &mut Value, contents_props: bool) {
    match value {
        Value::Object(fields) => {
            fields.remove("notes");
            fields.remove("speakerNotes");
            // props.presentation selects the visible Contents renderer. Only
            // this string is public; presentation metadata/notes stay private.
            if !contents_props || !fields.get("presentation").is_some_and(Value::is_string) {
                fields.remove("presentation");
            }
            if fields.contains_key("editor") {
                fields.insert("editor".into(), Value::Bool(false));
            }
            let contents = fields.get("type").and_then(Value::as_str) == Some("contents");
            for (key, child) in fields.iter_mut() {
                strip_private_fields(child, contents && key == "props");
            }
        }
        Value::Array(items) => items.iter_mut().for_each(strip_private),
        _ => {}
    }
}

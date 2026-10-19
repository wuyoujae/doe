// Origin: app/backend/core/src/slide_recovery/model_io.rs::grounded_outline_strings
use super::*;


pub(super) fn grounded_outline_strings(value: &Value) -> Vec<String> {
    fn collect_body(value: &Value, key: Option<&str>, output: &mut Vec<String>) {
        if key.is_some_and(crate::presentation::recovery::grounding::is_outline_control_key) {
            return;
        }
        match value {
            Value::Object(object)
                if object
                    .get("type")
                    .and_then(Value::as_str)
                    .is_some_and(|kind| kind.contains("image")) => {}
            Value::String(value)
                if !value.trim().is_empty()
                    && !value.starts_with("yrkie-asset-")
                    && !value.starts_with("https://") =>
            {
                let value = value.trim().to_string();
                if !output.contains(&value) {
                    output.push(value);
                }
            }
            Value::Number(value) => {
                let value = value.to_string();
                if !output.contains(&value) {
                    output.push(value);
                }
            }
            Value::Array(items) => {
                for item in items {
                    collect_body(item, key, output);
                }
            }
            Value::Object(object) => {
                for (key, item) in object {
                    collect_body(item, Some(key), output);
                }
            }
            _ => {}
        }
    }

    let mut output = Vec::new();
    let Some(contents) = value.get("contents").and_then(Value::as_object) else {
        return output;
    };
    const TITLE_KEYS: [&str; 6] = [
        "title",
        "section_title",
        "heading",
        "headline",
        "subtitle",
        "company_name",
    ];
    for key in TITLE_KEYS {
        if let Some(body) = contents.get(key).and_then(|item| item.get("body")) {
            collect_body(body, None, &mut output);
        }
    }
    for (key, item) in contents {
        if TITLE_KEYS.contains(&key.as_str()) {
            continue;
        }
        if let Some(body) = item.get("body") {
            collect_body(body, None, &mut output);
        }
    }
    output
}

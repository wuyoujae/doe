// Origin: app/backend/core/src/plugin_slide_validation.rs::safety
use super::*;


pub(super) fn safety(v: &Value, path: &str, key: &str, errors: &mut Failure, nodes: &mut usize) {
    *nodes += 1;
    if *nodes > 250_000 {
        if *nodes == 250_001 {
            errors.issue(
                path,
                "node_limit",
                "The document exceeds the JSON value budget.",
                "Reduce the amount of data in this request.",
            );
        }
        return;
    }
    match v {
        Value::String(s) => {
            if s.len() > 65_536
                || s.chars().any(|c| {
                    (c.is_control() && !matches!(c, '\n' | '\t'))
                        || matches!(c,'\u{202a}'..='\u{202e}'|'\u{2066}'..='\u{2069}')
                })
            {
                errors.issue(
                    path,
                    "text_limit",
                    "Text exceeds 65,536 UTF-8 bytes or contains unsafe controls.",
                    "Shorten the value and use LF for newlines.",
                );
            }
            if key == "src" {
                if doe_core::asset::reference::asset_id(s).is_none() {
                    errors.issue(path,"asset_source","Images require a canonical project asset reference.","Copy slideReference from the confirmed outline's image status. URLs, data URLs and local paths are not accepted.");
                }
            } else if key == "icon" && s.trim_start().starts_with('<') {
                if !safe_svg(s) {
                    errors.issue(path,"unsafe_svg","The icon is not a safe static SVG.","Use one SVG with only g/path/circle/ellipse/rect/line/polyline/polygon and geometry/presentation attributes. Scripts, events, links, CSS, entities, foreignObject and external resources are forbidden.");
                }
            } else if MARKUP.is_match(s) || ACTIVE.is_match(s) {
                errors.issue(path,"unsafe_content","Executable markup or active resource syntax is not accepted.","Use plain text or a validated SVG in an icon field; images must use src with an approved project reference.");
            }
        }
        Value::Array(a) => {
            for (i, v) in a.iter().enumerate() {
                safety(v, &format!("{path}/{i}"), key, errors, nodes);
            }
        }
        Value::Object(o) => {
            for (k, v) in o {
                if k.len() > 64
                    || !k
                        .bytes()
                        .all(|b| b.is_ascii_alphanumeric() || b"_-".contains(&b))
                    || matches!(k.as_str(), "__proto__" | "constructor" | "prototype")
                {
                    errors.issue(
                        path,
                        "unsafe_key",
                        "Unsupported property name.",
                        "Use only documented Schema property names.",
                    );
                } else {
                    safety(v, &format!("{path}/{k}"), k, errors, nodes);
                }
            }
        }
        _ => (),
    }
}

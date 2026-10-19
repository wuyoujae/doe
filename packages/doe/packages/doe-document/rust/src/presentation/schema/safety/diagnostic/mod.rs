// Origin: app/backend/core/src/plugin_slide_validation.rs::diagnostic
use super::*;

// Only server-authored diagnostic vocabulary and bounded structural paths leave this module.
pub fn diagnostic(error: &str, prefix: &str) -> Failure {
    let detail = error.split_once(": ").map(|(_, s)| s).unwrap_or("");
    let (raw_path, reason) = detail
        .split_once(' ')
        .unwrap_or(("root", "does not match the authoring contract"));
    let path_ok = raw_path.len() < 512
        && raw_path.starts_with("root")
        && raw_path
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._[]-".contains(&b));
    let path = if path_ok {
        format!(
            "{prefix}{}",
            raw_path
                .strip_prefix("root")
                .unwrap_or("")
                .replace('.', "/")
                .replace('[', "/")
                .replace(']', "")
        )
    } else {
        prefix.to_owned()
    };
    let safe_reason = reason.len() < 512
        && !reason.contains(['<', '>', '"', '\'', '`', '\\'])
        && reason.chars().all(|c| c.is_ascii() && !c.is_control());
    let mut failure = Failure::from("validation_failed");
    failure.issue(&path, "slide_schema", if safe_reason { reason } else { "The field does not match the DOE authoring contract." },
        "Correct this field using the Slide Schema reference. Unknown fields, runtime editor state, invalid component properties, duplicate IDs and invalid geometry are rejected; no automatic repair is performed.");
    failure
}

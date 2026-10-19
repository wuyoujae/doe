// Origin: app/backend/core/src/slide_recovery/duplicate_json.rs::parse_strict
use super::*;


pub fn parse_strict(raw: &str) -> Result<Value, String> {
    let parsed = parse(raw)?;
    if let Some(path) = parsed.conflicting_paths.first() {
        return Err(format!("conflicting duplicate object key at {path}"));
    }
    if let Some(path) = parsed.equal_paths.first() {
        return Err(format!("duplicate object key at {path}"));
    }
    Ok(parsed.value)
}

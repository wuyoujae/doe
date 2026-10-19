// Origin: app/backend/core/src/plugin_outline_validation.rs::parse_bounded
use super::*;


pub(super) fn parse_bounded(bytes: &[u8], limit: usize, depth: usize) -> Result<Value, Failure> {
    if bytes.len() > limit {
        return Err("request_too_large".into());
    }
    let mut decoder = serde_json::Deserializer::from_slice(bytes);
    let result = StrictValue(0, depth).deserialize(&mut decoder).and_then(|value| {
        decoder.end()?;
        Ok(value)
    });
    result.map_err(|e| {
        let mut failure = Failure::from("invalid_json");
        failure.line = Some(e.line());
        failure.column = Some(e.column());
        failure
    })
}

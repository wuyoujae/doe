// Origin: app/backend/core/src/plugin_outline_validation.rs::parse
use super::*;


pub fn parse(bytes: &[u8]) -> Result<Value, Failure> {
    parse_bounded(bytes, MAX_REQUEST_BYTES, 16)
}

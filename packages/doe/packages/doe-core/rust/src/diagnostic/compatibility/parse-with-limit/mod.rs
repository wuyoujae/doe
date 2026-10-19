// Origin: app/backend/core/src/plugin_outline_validation.rs::parse_with_limit
use super::*;


pub fn parse_with_limit(bytes: &[u8], limit: usize) -> Result<Value, Failure> {
    parse_bounded(bytes, limit, 32)
}

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use super::input::OutlineInput;


pub const EMPTY_OUTPUT_ERROR: &str = "outline_agent_empty_structured_output";

pub const OUTPUT_TOO_LARGE_ERROR: &str = "outline_agent_output_too_large";

pub const INVALID_JSON_ERROR: &str = "outline_agent_invalid_json";

pub const SCHEMA_MISMATCH_ERROR: &str = "outline_agent_schema_mismatch";


pub const MAX_OUTPUT_BYTES: usize = crate::presentation::outline::limits::MAX_OUTLINE_RESPONSE_BYTES;


#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum OutlineOperation {
    Create,
    Replace,
    Edit,
}


#[derive(Debug)]
pub struct DecodedDoeOutlineOutput {
    pub operation: OutlineOperation,
    pub expected_revision: Option<i64>,
    pub outline: OutlineInput,
    pub canonical_json: String,
    pub syntax_repair_count: usize,
    pub syntax_repair_summary: String,
}


#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct DoeOutlineEnvelope {
    operation: OutlineOperation,
    expected_revision: Option<i64>,
    outline: Value,
}
#[path = "decode-doe-traditional-outline/mod.rs"]
mod function_decode_doe_traditional_outline;
pub use function_decode_doe_traditional_outline::decode_doe_traditional_outline;

#[cfg(test)]
mod tests;
use super::recovery as outline_recovery;
#[path = "decode-doe-traditional-outline-without-schema-validation/mod.rs"]
mod production_decoder;
pub use production_decoder::decode_doe_traditional_outline_without_schema_validation;

#[path = "json-code-fence/mod.rs"]
mod json_code_fence;

#[path = "final-response/mod.rs"]
mod final_response;

#[path = "strict-deck/mod.rs"]
mod strict_deck;

#[allow(dead_code)]
#[path = "strict-json/mod.rs"]
mod strict_json;

mod types;


#[cfg(test)]
mod tests;


use serde_json::{Map, Value};

use sha2::{Digest, Sha256};


use crate::presentation::schema::contract::SlideDeckExpectations;

use json_code_fence::JsonCodeFence;


pub use types::{
    ProcessedSlideOutput, SlideAutoRepairV2Operation, SlideAutoRepairV2Proof,
    SLIDE_AUTO_REPAIR_V2_VERSION,
};
#[path = "process/mod.rs"]
mod function_process;
pub use function_process::process;

#[path = "sha256-hex/mod.rs"]
mod function_sha256_hex;
 use function_sha256_hex::sha256_hex;

#[path = "canonical-value-sha256/mod.rs"]
mod function_canonical_value_sha256;
pub use function_canonical_value_sha256::canonical_value_sha256;


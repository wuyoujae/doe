use super::Snapshot;

use doe_core::diagnostic::compatibility::Failure;

use crate::presentation::schema::contract as contract;

use serde_json::{json, Value};
#[path = "prepare-candidate/mod.rs"]
mod function_prepare_candidate;
pub use function_prepare_candidate::prepare_candidate;

#[path = "validate/mod.rs"]
mod function_validate;
pub use function_validate::validate;

#[path = "changed-safety/mod.rs"]
mod function_changed_safety;
 use function_changed_safety::changed_safety;


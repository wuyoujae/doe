//! Pure, fail-fast validation for a saved DOE page. No repair, I/O or rendering.
//! Runtime extension fields remain untouched; known content and layout fields
//! use the same constraints as authoring. Callers own authorization and commits.
use super::*;

use doe_core::diagnostic::compatibility::Failure;
#[path = "validate-slide/mod.rs"]
mod function_validate_slide;
pub use function_validate_slide::validate_slide;

#[path = "validate/mod.rs"]
mod function_validate;
 use function_validate::validate;

#[path = "fields/mod.rs"]
mod function_fields;
 use function_fields::fields;

#[path = "validate-node-content/mod.rs"]
mod function_validate_node_content;
 use function_validate_node_content::validate_node_content;



#[cfg(test)]
mod tests;

use super::decode::{EMPTY_OUTPUT_ERROR, OUTPUT_TOO_LARGE_ERROR, INVALID_JSON_ERROR, SCHEMA_MISMATCH_ERROR, MAX_OUTPUT_BYTES, OutlineOperation};
use serde::Deserialize;

use serde_json::{json, Map, Value};


use doe_core::json::syntax::JsonSyntaxRepairReport;

use crate::presentation::outline::recovery::{
    self as outline_recovery, Ambiguity, DiagnosticReport, OutlineContractGraph, RepairEdit, RepairProof,
};

use crate::presentation::outline::input::OutlineInput;

pub const OUTPUT_CONTRACT_VIOLATION_ERROR: &str = "outline_agent_output_contract_violation";

pub const DEFAULT_MAX_OUTPUT_TOKENS: u32 = 65_536;

const MAX_JSON_SYNTAX_REPAIRS_PER_OUTLINE: usize = 128;

const MAX_SEMANTIC_REPAIRS_PER_OUTLINE: usize = 128;


#[derive(Debug)]
pub struct ParsedOutlineOutput {
    pub operation: OutlineOperation,
    pub expected_revision: Option<i64>,
    pub outline: OutlineInput,
    pub canonical_json: String,
    pub syntax_repair_count: usize,
    pub syntax_repair_summary: String,
    pub image_type_repair_count: usize,
    pub missing_generated_image_type_repair_count: usize,
    pub blank_paragraph_repair_count: usize,
    pub ignored_unknown_field_count: usize,
    pub diagnostic_report: DiagnosticReport,
    pub repair_proof: RepairProof,
}


#[derive(Debug, Deserialize)]
struct OutlineEnvelope {
    operation: OutlineOperation,
    expected_revision: Option<i64>,
    outline: Value,
}
#[path = "apply-request-contract/mod.rs"]
mod function_apply_request_contract;
pub use function_apply_request_contract::apply_request_contract;

#[path = "response-format/mod.rs"]
mod function_response_format;
pub use function_response_format::response_format;

#[path = "parse-and-validate/mod.rs"]
mod function_parse_and_validate;
pub use function_parse_and_validate::parse_and_validate;

#[path = "parse-and-validate-safely/mod.rs"]
mod function_parse_and_validate_safely;
pub use function_parse_and_validate_safely::parse_and_validate_safely;

#[path = "canonicalize-outline/mod.rs"]
mod function_canonicalize_outline;
 use function_canonicalize_outline::canonicalize_outline;

#[path = "validate-unknown-fields/mod.rs"]
mod function_validate_unknown_fields;
 use function_validate_unknown_fields::validate_unknown_fields;

#[path = "collect-safe-structural-edits/mod.rs"]
mod function_collect_safe_structural_edits;
 use function_collect_safe_structural_edits::collect_safe_structural_edits;

#[path = "quarantinable-transport-field/mod.rs"]
mod function_quarantinable_transport_field;
 use function_quarantinable_transport_field::quarantinable_transport_field;

#[path = "derived-page-number-is-valid/mod.rs"]
mod function_derived_page_number_is_valid;
 use function_derived_page_number_is_valid::derived_page_number_is_valid;

#[path = "semantic-edit/mod.rs"]
mod function_semantic_edit;
 use function_semantic_edit::semantic_edit;

#[path = "json-pointer-child/mod.rs"]
mod function_json_pointer_child;
 use function_json_pointer_child::json_pointer_child;

#[path = "unsafe-semantic-repair/mod.rs"]
mod function_unsafe_semantic_repair;
 use function_unsafe_semantic_repair::unsafe_semantic_repair;

#[path = "business-string-multiset-hash/mod.rs"]
mod function_business_string_multiset_hash;
 use function_business_string_multiset_hash::business_string_multiset_hash;

#[path = "collect-business-strings/mod.rs"]
mod function_collect_business_strings;
 use function_collect_business_strings::collect_business_strings;

#[path = "normalize-blank-text-block-paragraphs/mod.rs"]
mod function_normalize_blank_text_block_paragraphs;
 use function_normalize_blank_text_block_paragraphs::normalize_blank_text_block_paragraphs;

#[path = "normalize-missing-generated-image-types/mod.rs"]
mod function_normalize_missing_generated_image_types;
 use function_normalize_missing_generated_image_types::normalize_missing_generated_image_types;

#[path = "is-unambiguous-missing-generated-image-type/mod.rs"]
mod function_is_unambiguous_missing_generated_image_type;
 use function_is_unambiguous_missing_generated_image_type::is_unambiguous_missing_generated_image_type;

#[path = "normalize-generated-image-types/mod.rs"]
mod function_normalize_generated_image_types;
 use function_normalize_generated_image_types::normalize_generated_image_types;

#[path = "parse-json-with-bounded-syntax-repair/mod.rs"]
mod function_parse_json_with_bounded_syntax_repair;
pub use function_parse_json_with_bounded_syntax_repair::parse_json_with_bounded_syntax_repair;

#[path = "parse-outline-contents-with-report/mod.rs"]
mod function_parse_outline_contents_with_report;
 use function_parse_outline_contents_with_report::parse_outline_contents_with_report;

#[path = "rank-outline-contents-candidate/mod.rs"]
mod function_rank_outline_contents_candidate;
 use function_rank_outline_contents_candidate::rank_outline_contents_candidate;

#[path = "rank-outline-wire-candidate/mod.rs"]
mod function_rank_outline_wire_candidate;
 use function_rank_outline_wire_candidate::rank_outline_wire_candidate;

#[path = "streamed-content-bytes/mod.rs"]
mod function_streamed_content_bytes;
pub use function_streamed_content_bytes::streamed_content_bytes;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;

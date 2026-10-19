use serde_json::Value;


use doe_core::json::syntax::JsonSyntaxRepairReport;


use super::contract::OUTLINE_CONTRACT_VERSION;

use super::diagnostics::{
    sha256_hex, DiagnosticFinding, DiagnosticReport, RepairEdit, RepairProof,
};


mod invariant;

mod lexical;

mod structural;

mod unique;


pub use invariant::decoded_business_string_multiset;

use invariant::decoded_string_multiset_hash;

use lexical::{frame_single_json_document, repair_lexical_boundaries};

use structural::repair_structural_boundaries;

use unique::parse_unique_json;


pub(super) const LINEAR_REPAIR_LIMIT_PER_KIB: usize = 16;

pub(super) const ABSOLUTE_LINEAR_REPAIR_LIMIT: usize = 4_096;


#[derive(Debug)]
pub struct CompiledJson {
    pub value: Value,
    pub canonical_source: String,
    pub(crate) syntax_report: JsonSyntaxRepairReport,
    pub diagnostics: DiagnosticReport,
    pub proof: RepairProof,
}


#[derive(Debug)]
pub(super) struct LinearRepair {
    pub(super) source: String,
    pub(super) findings: Vec<DiagnosticFinding>,
    pub(super) edits: Vec<RepairEdit>,
    pub(super) syntax_report: JsonSyntaxRepairReport,
}
#[path = "compile-json/mod.rs"]
mod function_compile_json;
pub use function_compile_json::compile_json;



#[cfg(test)]
mod tests;

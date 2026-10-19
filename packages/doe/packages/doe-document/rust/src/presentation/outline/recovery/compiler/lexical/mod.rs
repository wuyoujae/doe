use doe_core::json::syntax::{JsonSyntaxRepairKind, JsonSyntaxRepairReport};


use super::{LinearRepair, ABSOLUTE_LINEAR_REPAIR_LIMIT};

use crate::presentation::outline::recovery::diagnostics::{
    sha256_hex, Ambiguity, DiagnosticFinding, FindingSeverity, RecoveryStage, RepairEdit,
};


#[derive(Debug, Clone)]
struct LexicalMutation {
    start: usize,
    end: usize,
    replacement: String,
    kind: JsonSyntaxRepairKind,
    code: &'static str,
    constraint_id: &'static str,
}


pub(super) struct FramedJson {
    pub(super) source: String,
    pub(super) findings: Vec<DiagnosticFinding>,
    pub(super) edits: Vec<RepairEdit>,
    pub(super) syntax_report: JsonSyntaxRepairReport,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct SourceSpan {
    start: usize,
    end: usize,
}


#[derive(Debug, Clone, Copy)]
struct SourceLine<'a> {
    start: usize,
    end: usize,
    text: &'a str,
}
#[path = "repair-lexical-boundaries/mod.rs"]
mod function_repair_lexical_boundaries;
pub(super) use function_repair_lexical_boundaries::repair_lexical_boundaries;

#[path = "frame-single-json-document/mod.rs"]
mod function_frame_single_json_document;
pub(super) use function_frame_single_json_document::frame_single_json_document;

#[path = "record-wrapper-removal/mod.rs"]
mod function_record_wrapper_removal;
 use function_record_wrapper_removal::record_wrapper_removal;

#[path = "fenced-json-spans/mod.rs"]
mod function_fenced_json_spans;
 use function_fenced_json_spans::fenced_json_spans;

#[path = "source-lines/mod.rs"]
mod function_source_lines;
 use function_source_lines::source_lines;

#[path = "fence-opening/mod.rs"]
mod function_fence_opening;
 use function_fence_opening::fence_opening;

#[path = "strict-json-root-spans/mod.rs"]
mod function_strict_json_root_spans;
 use function_strict_json_root_spans::strict_json_root_spans;

#[path = "balanced-json-root-end/mod.rs"]
mod function_balanced_json_root_end;
 use function_balanced_json_root_end::balanced_json_root_end;

#[path = "trimmed-span/mod.rs"]
mod function_trimmed_span;
 use function_trimmed_span::trimmed_span;


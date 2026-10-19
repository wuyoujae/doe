use std::collections::BTreeMap;


use doe_core::json::syntax::{JsonSyntaxRepairKind, JsonSyntaxRepairReport};


use super::{LinearRepair, ABSOLUTE_LINEAR_REPAIR_LIMIT, LINEAR_REPAIR_LIMIT_PER_KIB};

use crate::presentation::outline::recovery::diagnostics::{sha256_hex, Ambiguity, DiagnosticFinding, RepairEdit};


#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TokenKind {
    ObjectStart,
    ObjectEnd,
    ArrayStart,
    ArrayEnd,
    Colon,
    Comma,
    String,
    Atom,
}


impl TokenKind {
    fn starts_value(self) -> bool {
        matches!(
            self,
            Self::ObjectStart | Self::ArrayStart | Self::String | Self::Atom
        )
    }
}


#[derive(Debug, Clone)]
struct Token {
    kind: TokenKind,
    start: usize,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ObjectState {
    KeyOrEnd,
    Colon,
    Value,
    CommaOrEnd,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ArrayState {
    ValueOrEnd,
    CommaOrEnd,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum FrameKind {
    Object(ObjectState),
    Array(ArrayState),
}


#[derive(Debug, Clone, Copy)]
struct Frame {
    kind: FrameKind,
    start: usize,
}


impl Frame {
    fn closer(self) -> char {
        match self.kind {
            FrameKind::Object(_) => '}',
            FrameKind::Array(_) => ']',
        }
    }

    fn accepts_parent_separator(self) -> bool {
        matches!(
            self.kind,
            FrameKind::Object(ObjectState::CommaOrEnd) | FrameKind::Array(ArrayState::CommaOrEnd)
        )
    }
}
#[path = "repair-structural-boundaries/mod.rs"]
mod function_repair_structural_boundaries;
pub(super) use function_repair_structural_boundaries::repair_structural_boundaries;

#[path = "consume-root-value/mod.rs"]
mod function_consume_root_value;
 use function_consume_root_value::consume_root_value;

#[path = "consume-nested-value/mod.rs"]
mod function_consume_nested_value;
 use function_consume_nested_value::consume_nested_value;

#[path = "object-comma-belongs-to-parent/mod.rs"]
mod function_object_comma_belongs_to_parent;
 use function_object_comma_belongs_to_parent::object_comma_belongs_to_parent;

#[path = "array-comma-belongs-to-parent/mod.rs"]
mod function_array_comma_belongs_to_parent;
 use function_array_comma_belongs_to_parent::array_comma_belongs_to_parent;

#[path = "closes-ancestor/mod.rs"]
mod function_closes_ancestor;
 use function_closes_ancestor::closes_ancestor;

#[path = "insert-missing-closer/mod.rs"]
mod function_insert_missing_closer;
 use function_insert_missing_closer::insert_missing_closer;

#[path = "apply-insertions/mod.rs"]
mod function_apply_insertions;
 use function_apply_insertions::apply_insertions;

#[path = "tokenize/mod.rs"]
mod function_tokenize;
 use function_tokenize::tokenize;


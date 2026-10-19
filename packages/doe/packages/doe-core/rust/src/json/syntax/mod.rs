//! Legacy bounded-repair oracle retained for regression tests and shared repair telemetry.
//! Outline production parsing is owned by `outline_recovery::compiler`.
#![cfg_attr(not(test), allow(dead_code))]

use std::collections::{BTreeMap, HashMap};

use std::hash::{DefaultHasher, Hash, Hasher};


use serde_json::Value;


const MAX_REPAIRS_PER_VALUE: usize = 32;

const MAX_SEARCH_STATES: usize = 1_024;

const MAX_SEARCH_CANDIDATE_BYTES: usize = 32 * 1024 * 1024;

const NEARBY_CHARACTER_RADIUS: usize = 32;


#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum JsonSyntaxRepairKind {
    RemoveBom,
    UnwrapMarkdownFence,
    InsertMissingComma,
    InsertMissingColon,
    InsertMissingDelimiter,
    InsertMissingStringQuote,
    RemoveExtraToken,
    ReplaceMismatchedDelimiter,
    EscapeStringQuote,
    EscapeStringControlCharacter,
    NormalizeQuotedToken,
    QuoteBareToken,
}


impl JsonSyntaxRepairKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::RemoveBom => "remove_bom",
            Self::UnwrapMarkdownFence => "unwrap_markdown_fence",
            Self::InsertMissingComma => "insert_missing_comma",
            Self::InsertMissingColon => "insert_missing_colon",
            Self::InsertMissingDelimiter => "insert_missing_delimiter",
            Self::InsertMissingStringQuote => "insert_missing_string_quote",
            Self::RemoveExtraToken => "remove_extra_token",
            Self::ReplaceMismatchedDelimiter => "replace_mismatched_delimiter",
            Self::EscapeStringQuote => "escape_string_quote",
            Self::EscapeStringControlCharacter => "escape_string_control_character",
            Self::NormalizeQuotedToken => "normalize_quoted_token",
            Self::QuoteBareToken => "quote_bare_token",
        }
    }
}


#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JsonSyntaxRepairEdit {
    pub kind: JsonSyntaxRepairKind,
    pub byte_offset: usize,
    pub scope: String,
}


#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct JsonSyntaxRepairReport {
    edits: Vec<JsonSyntaxRepairEdit>,
}


impl JsonSyntaxRepairReport {
    pub fn record(
        &mut self,
        kind: JsonSyntaxRepairKind,
        byte_offset: usize,
        scope: impl Into<String>,
    ) {
        self.edits.push(JsonSyntaxRepairEdit {
            kind,
            byte_offset,
            scope: scope.into(),
        });
    }

    pub fn count(&self) -> usize {
        self.edits.len()
    }

    pub fn set_scope(&mut self, scope: impl Into<String>) {
        let scope = scope.into();
        for edit in &mut self.edits {
            edit.scope = scope.clone();
        }
    }

    pub fn extend(&mut self, other: Self) {
        self.edits.extend(other.edits);
    }

    pub fn summary(&self) -> String {
        let mut groups = BTreeMap::<(&str, &str), Vec<usize>>::new();
        for edit in &self.edits {
            groups
                .entry((edit.scope.as_str(), edit.kind.as_str()))
                .or_default()
                .push(edit.byte_offset);
        }
        groups
            .into_iter()
            .map(|((scope, kind), offsets)| {
                let positions = offsets
                    .iter()
                    .take(8)
                    .map(usize::to_string)
                    .collect::<Vec<_>>()
                    .join("|");
                format!("{scope}:{kind}={}@{positions}", offsets.len())
            })
            .collect::<Vec<_>>()
            .join(",")
    }
}


#[derive(Debug, Clone)]
struct RepairState {
    text: String,
    edits: Vec<JsonSyntaxRepairEdit>,
}


impl RepairState {
    fn cost(&self) -> usize {
        self.edits.len()
    }
}


#[derive(Debug, Clone, Default)]
struct LexicalState {
    in_string: bool,
    escaped: bool,
    stack: Vec<char>,
}
#[cfg(test)]
#[path = "parse-json-with-syntax-repair/mod.rs"]
mod function_parse_json_with_syntax_repair;
#[cfg(test)]
pub use function_parse_json_with_syntax_repair::parse_json_with_syntax_repair;

#[path = "parse-json-with-syntax-repair-ranked/mod.rs"]
mod function_parse_json_with_syntax_repair_ranked;
pub use function_parse_json_with_syntax_repair_ranked::parse_json_with_syntax_repair_ranked;



#[derive(Debug, Clone)]
pub struct RepairedJsonSource {
    pub value: Value,
    pub report: JsonSyntaxRepairReport,
}
#[path = "parse-json-with-syntax-repair-ranked-source/mod.rs"]
mod function_parse_json_with_syntax_repair_ranked_source;
pub use function_parse_json_with_syntax_repair_ranked_source::parse_json_with_syntax_repair_ranked_source;

#[path = "prepare-candidate/mod.rs"]
mod function_prepare_candidate;
 use function_prepare_candidate::prepare_candidate;

#[path = "unwrap-single-markdown-json-fence/mod.rs"]
mod function_unwrap_single_markdown_json_fence;
 use function_unwrap_single_markdown_json_fence::unwrap_single_markdown_json_fence;

#[path = "search-minimal-repair/mod.rs"]
mod function_search_minimal_repair;
 use function_search_minimal_repair::search_minimal_repair;

#[path = "generate-neighbors/mod.rs"]
mod function_generate_neighbors;
 use function_generate_neighbors::generate_neighbors;

#[path = "push-insert/mod.rs"]
mod function_push_insert;
 use function_push_insert::push_insert;

#[path = "push-remove-char/mod.rs"]
mod function_push_remove_char;
 use function_push_remove_char::push_remove_char;

#[path = "push-replace-char/mod.rs"]
mod function_push_replace_char;
 use function_push_replace_char::push_replace_char;

#[path = "push-control-escape/mod.rs"]
mod function_push_control_escape;
 use function_push_control_escape::push_control_escape;

#[path = "push-normalized-quoted-token/mod.rs"]
mod function_push_normalized_quoted_token;
 use function_push_normalized_quoted_token::push_normalized_quoted_token;

#[path = "push-quoted-bare-token/mod.rs"]
mod function_push_quoted_bare_token;
 use function_push_quoted_bare_token::push_quoted_bare_token;

#[path = "error-byte-offset/mod.rs"]
mod function_error_byte_offset;
 use function_error_byte_offset::error_byte_offset;

#[path = "nearest-character-boundary/mod.rs"]
mod function_nearest_character_boundary;
 use function_nearest_character_boundary::nearest_character_boundary;

#[path = "nearby-character-boundaries/mod.rs"]
mod function_nearby_character_boundaries;
 use function_nearby_character_boundaries::nearby_character_boundaries;

#[path = "lexical-state-at/mod.rs"]
mod function_lexical_state_at;
 use function_lexical_state_at::lexical_state_at;

#[path = "previous-non-whitespace/mod.rs"]
mod function_previous_non_whitespace;
 use function_previous_non_whitespace::previous_non_whitespace;

#[path = "previous-non-whitespace-position/mod.rs"]
mod function_previous_non_whitespace_position;
 use function_previous_non_whitespace_position::previous_non_whitespace_position;

#[path = "next-non-whitespace/mod.rs"]
mod function_next_non_whitespace;
 use function_next_non_whitespace::next_non_whitespace;

#[path = "char-at/mod.rs"]
mod function_char_at;
 use function_char_at::char_at;

#[path = "quoted-token-is-followed-by-colon/mod.rs"]
mod function_quoted_token_is_followed_by_colon;
 use function_quoted_token_is_followed_by_colon::quoted_token_is_followed_by_colon;

#[path = "matching-closer/mod.rs"]
mod function_matching_closer;
 use function_matching_closer::matching_closer;

#[path = "can-end-json-value/mod.rs"]
mod function_can_end_json_value;
 use function_can_end_json_value::can_end_json_value;

#[path = "can-start-json-value/mod.rs"]
mod function_can_start_json_value;
 use function_can_start_json_value::can_start_json_value;

#[path = "is-bare-token-character/mod.rs"]
mod function_is_bare_token_character;
 use function_is_bare_token_character::is_bare_token_character;

#[path = "text-hash/mod.rs"]
mod function_text_hash;
 use function_text_hash::text_hash;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;


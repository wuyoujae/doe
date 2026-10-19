// Origin: app/backend/core/src/outline_recovery/compiler/lexical.rs::repair_lexical_boundaries
use super::*;


pub(in super::super) fn repair_lexical_boundaries(source: &str) -> Result<LinearRepair, String> {
    let bytes = source.as_bytes();
    let mut in_string = false;
    let mut escaped = false;
    let mut string_start = 0usize;
    let mut cursor = 0usize;
    let mut mutations = Vec::<LexicalMutation>::new();
    let mut container_stack = Vec::<u8>::new();

    while cursor < bytes.len() {
        let byte = bytes[cursor];
        if in_string {
            if escaped {
                escaped = false;
            } else if byte == b'\\' {
                escaped = true;
            } else if byte == b'"' {
                in_string = false;
            } else if byte < 0x20 {
                let replacement = match byte {
                    b'\n' => "\\n".to_string(),
                    b'\r' => "\\r".to_string(),
                    b'\t' => "\\t".to_string(),
                    0x08 => "\\b".to_string(),
                    0x0c => "\\f".to_string(),
                    _ => format!("\\u{byte:04x}"),
                };
                mutations.push(LexicalMutation {
                    start: cursor,
                    end: cursor + 1,
                    replacement,
                    kind: JsonSyntaxRepairKind::EscapeStringControlCharacter,
                    code: "json.string.control_character",
                    constraint_id: "json.string.escape_control_character",
                });
            }
        } else {
            match byte {
                b'"' => {
                    in_string = true;
                    escaped = false;
                    string_start = cursor;
                }
                b'{' => container_stack.push(b'}'),
                b'[' => container_stack.push(b']'),
                b'}' | b']' if container_stack.last() == Some(&byte) => {
                    container_stack.pop();
                }
                b'}' | b']' if container_stack.is_empty() => {
                    mutations.push(LexicalMutation {
                        start: cursor,
                        end: cursor + 1,
                        replacement: String::new(),
                        kind: JsonSyntaxRepairKind::RemoveExtraToken,
                        code: "json.container.extra_closer",
                        constraint_id: "json.root.remove_unmatched_closer",
                    });
                }
                b',' => {
                    let next = bytes[cursor + 1..]
                        .iter()
                        .copied()
                        .find(|candidate| !candidate.is_ascii_whitespace());
                    if next.is_some_and(|candidate| matches!(candidate, b'}' | b']')) {
                        mutations.push(LexicalMutation {
                            start: cursor,
                            end: cursor + 1,
                            replacement: String::new(),
                            kind: JsonSyntaxRepairKind::RemoveExtraToken,
                            code: "json.separator.trailing_comma",
                            constraint_id: "json.container.remove_trailing_comma",
                        });
                    }
                }
                _ => {}
            }
        }
        cursor += 1;
    }

    if in_string {
        if escaped {
            return Err(format!(
                "unterminated JSON escape sequence at byte {}",
                source.len().saturating_sub(1)
            ));
        }
        let mut suffix_start = source.len();
        let mut search_end = source.len();
        for expected in &container_stack {
            let prefix = &source[..search_end];
            let Some((offset, actual)) = prefix
                .char_indices()
                .rev()
                .find(|(_, character)| !character.is_whitespace())
            else {
                return Err(format!("unterminated JSON string at byte {string_start}"));
            };
            if actual as u8 != *expected {
                return Err(format!(
                    "unterminated JSON string has no unique structural suffix at byte {string_start}: expected {} but found {actual}",
                    *expected as char
                ));
            }
            suffix_start = offset;
            search_end = offset;
        }
        if suffix_start == source.len() || suffix_start <= string_start {
            return Err(format!("unterminated JSON string at byte {string_start}"));
        }
        mutations.push(LexicalMutation {
            start: suffix_start,
            end: suffix_start,
            replacement: "\"".to_string(),
            kind: JsonSyntaxRepairKind::InsertMissingStringQuote,
            code: "json.string.missing_quote",
            constraint_id: "json.string.close_before_structural_suffix",
        });
    }

    if mutations.len() > ABSOLUTE_LINEAR_REPAIR_LIMIT {
        return Err("lexical JSON repair exceeded its bounded edit limit".to_string());
    }
    let mut repaired = source.to_string();
    for mutation in mutations.iter().rev() {
        repaired.replace_range(mutation.start..mutation.end, &mutation.replacement);
    }
    let mut findings = Vec::with_capacity(mutations.len());
    let mut edits = Vec::with_capacity(mutations.len());
    let mut syntax_report = JsonSyntaxRepairReport::default();
    for mutation in mutations {
        let before = &source.as_bytes()[mutation.start..mutation.end];
        findings.push(DiagnosticFinding {
            code: mutation.code.to_string(),
            stage: RecoveryStage::S5,
            invariant: "lexical_validity".to_string(),
            mutation: "escape_or_close".to_string(),
            scope: format!("string@{string_start}"),
            multiplicity: "single".to_string(),
            ambiguity: Ambiguity::A1,
            severity: FindingSeverity::Error,
            json_pointer: String::new(),
            source_byte_start: Some(mutation.start),
            source_byte_end: Some(mutation.end),
            expected: mutation.constraint_id.to_string(),
            actual: mutation.code.to_string(),
            evidence_hash: sha256_hex(before),
            constraint_id: Some(mutation.constraint_id.to_string()),
        });
        edits.push(RepairEdit {
            operation: if mutation.start == mutation.end {
                "insert_token".to_string()
            } else {
                "replace_token".to_string()
            },
            source_byte_start: mutation.start,
            source_byte_end: mutation.end,
            token: Some(mutation.replacement.clone()),
            target_pointer: String::new(),
            before_hash: sha256_hex(before),
            after_hash: sha256_hex(mutation.replacement.as_bytes()),
            constraint_id: mutation.constraint_id.to_string(),
            ambiguity: Ambiguity::A1,
        });
        syntax_report.record(mutation.kind, mutation.start, "envelope");
    }
    Ok(LinearRepair {
        source: repaired,
        findings,
        edits,
        syntax_report,
    })
}

// Origin: app/backend/core/src/outline_recovery/compiler/structural.rs::repair_structural_boundaries
use super::*;


pub(in super::super) fn repair_structural_boundaries(source: &str) -> Result<LinearRepair, String> {
    let tokens = tokenize(source)?;
    let repair_limit = ((source.len() + 1023) / 1024)
        .saturating_mul(LINEAR_REPAIR_LIMIT_PER_KIB)
        .clamp(128, ABSOLUTE_LINEAR_REPAIR_LIMIT);
    let mut frames = Vec::<Frame>::new();
    let mut insertions = Vec::<(usize, char, &'static str, usize)>::new();
    let mut root_complete = false;
    let mut index = 0usize;

    while index < tokens.len() {
        let token = &tokens[index];
        if frames.is_empty() {
            if root_complete {
                return Err(format!(
                    "multiple JSON root values near byte {} ({:?})",
                    token.start, token.kind
                ));
            }
            consume_root_value(token, &mut frames, &mut root_complete)?;
            index += 1;
            continue;
        }

        if insertions.len() >= repair_limit {
            return Err(format!(
                "linear JSON repair exceeded the proportional limit of {repair_limit} edits"
            ));
        }

        let top = frames.len() - 1;
        match frames[top].kind {
            FrameKind::Object(ObjectState::KeyOrEnd) => match token.kind {
                TokenKind::ObjectEnd => {
                    frames.pop();
                    if frames.is_empty() {
                        root_complete = true;
                    }
                    index += 1;
                }
                TokenKind::String => {
                    frames[top].kind = FrameKind::Object(ObjectState::Colon);
                    index += 1;
                }
                _ if closes_ancestor(token.kind, &frames[..top]) => {
                    insert_missing_closer(
                        &frames,
                        token.start,
                        &mut insertions,
                        "json.object.close_before_ancestor_end",
                    );
                    frames.pop();
                }
                _ => {
                    return Err(format!(
                        "object key or end expected near byte {}",
                        token.start
                    ))
                }
            },
            FrameKind::Object(ObjectState::Colon) => {
                if token.kind == TokenKind::Colon {
                    frames[top].kind = FrameKind::Object(ObjectState::Value);
                    index += 1;
                } else if token.kind.starts_value() {
                    insertions.push((
                        token.start,
                        ':',
                        "json.object.colon_before_value",
                        frames[top].start,
                    ));
                    frames[top].kind = FrameKind::Object(ObjectState::Value);
                } else {
                    return Err(format!("object colon expected near byte {}", token.start));
                }
            }
            FrameKind::Object(ObjectState::Value) => {
                consume_nested_value(token, &mut frames)?;
                index += 1;
            }
            FrameKind::Object(ObjectState::CommaOrEnd) => match token.kind {
                TokenKind::ObjectEnd => {
                    frames.pop();
                    if frames.is_empty() {
                        root_complete = true;
                    }
                    index += 1;
                }
                TokenKind::Comma => {
                    if object_comma_belongs_to_parent(&tokens, index, &frames) {
                        insert_missing_closer(
                            &frames,
                            token.start,
                            &mut insertions,
                            "json.object.close_before_array_sibling",
                        );
                        frames.pop();
                    } else {
                        frames[top].kind = FrameKind::Object(ObjectState::KeyOrEnd);
                        index += 1;
                    }
                }
                TokenKind::String => {
                    insertions.push((
                        token.start,
                        ',',
                        "json.object.comma_between_members",
                        frames[top].start,
                    ));
                    frames[top].kind = FrameKind::Object(ObjectState::KeyOrEnd);
                }
                _ if closes_ancestor(token.kind, &frames[..top]) => {
                    insert_missing_closer(
                        &frames,
                        token.start,
                        &mut insertions,
                        "json.object.close_before_ancestor_end",
                    );
                    frames.pop();
                }
                _ => {
                    return Err(format!(
                        "object comma or end expected near byte {} ({:?})",
                        token.start, token.kind
                    ))
                }
            },
            FrameKind::Array(ArrayState::ValueOrEnd) => match token.kind {
                TokenKind::ArrayEnd => {
                    frames.pop();
                    if frames.is_empty() {
                        root_complete = true;
                    }
                    index += 1;
                }
                _ if token.kind.starts_value() => {
                    consume_nested_value(token, &mut frames)?;
                    index += 1;
                }
                _ if closes_ancestor(token.kind, &frames[..top]) => {
                    insert_missing_closer(
                        &frames,
                        token.start,
                        &mut insertions,
                        "json.array.close_before_ancestor_end",
                    );
                    frames.pop();
                }
                _ => {
                    return Err(format!(
                        "array value or end expected near byte {}",
                        token.start
                    ))
                }
            },
            FrameKind::Array(ArrayState::CommaOrEnd) => match token.kind {
                TokenKind::ArrayEnd => {
                    frames.pop();
                    if frames.is_empty() {
                        root_complete = true;
                    }
                    index += 1;
                }
                TokenKind::Comma => {
                    if array_comma_belongs_to_parent(&tokens, index, &frames) {
                        insert_missing_closer(
                            &frames,
                            token.start,
                            &mut insertions,
                            "json.array.close_before_object_sibling",
                        );
                        frames.pop();
                    } else {
                        frames[top].kind = FrameKind::Array(ArrayState::ValueOrEnd);
                        index += 1;
                    }
                }
                _ if token.kind.starts_value() => {
                    insertions.push((
                        token.start,
                        ',',
                        "json.array.comma_between_items",
                        frames[top].start,
                    ));
                    frames[top].kind = FrameKind::Array(ArrayState::ValueOrEnd);
                }
                _ if closes_ancestor(token.kind, &frames[..top]) => {
                    insert_missing_closer(
                        &frames,
                        token.start,
                        &mut insertions,
                        "json.array.close_before_ancestor_end",
                    );
                    frames.pop();
                }
                _ => {
                    return Err(format!(
                        "array comma or end expected near byte {}",
                        token.start
                    ))
                }
            },
        }
    }

    while let Some(frame) = frames.pop() {
        if !frame.accepts_parent_separator() {
            return Err(format!(
                "truncated JSON lost a value near container byte {}",
                frame.start
            ));
        }
        insertions.push((
            source.len(),
            frame.closer(),
            "json.container.close_at_eof",
            frame.start,
        ));
        if insertions.len() > repair_limit {
            return Err(format!(
                "linear JSON repair exceeded the proportional limit of {repair_limit} edits"
            ));
        }
    }

    let repaired_source = apply_insertions(source, &insertions);
    let mut findings = Vec::with_capacity(insertions.len());
    let mut edits = Vec::with_capacity(insertions.len());
    let mut syntax_report = JsonSyntaxRepairReport::default();
    for (offset, token, constraint_id, frame_start) in insertions {
        findings.push(DiagnosticFinding::structural_insert(
            offset,
            token,
            constraint_id,
            format!("container@{frame_start}"),
        ));
        edits.push(RepairEdit {
            operation: "insert_token".to_string(),
            source_byte_start: offset,
            source_byte_end: offset,
            token: Some(token.to_string()),
            target_pointer: String::new(),
            before_hash: sha256_hex(&[]),
            after_hash: sha256_hex(token.to_string().as_bytes()),
            constraint_id: constraint_id.to_string(),
            ambiguity: Ambiguity::A1,
        });
        let kind = match token {
            ',' => JsonSyntaxRepairKind::InsertMissingComma,
            ':' => JsonSyntaxRepairKind::InsertMissingColon,
            _ => JsonSyntaxRepairKind::InsertMissingDelimiter,
        };
        syntax_report.record(kind, offset, "envelope");
    }

    Ok(LinearRepair {
        source: repaired_source,
        findings,
        edits,
        syntax_report,
    })
}

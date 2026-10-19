// Origin: app/backend/core/src/json_syntax_repair.rs::generate_neighbors
use super::*;


pub(super) fn generate_neighbors(state: &RepairState, error: &serde_json::Error) -> Vec<RepairState> {
    let center = error_byte_offset(&state.text, error);
    let positions = nearby_character_boundaries(&state.text, center);
    let mut neighbors = Vec::new();

    for &position in &positions {
        let lexical = lexical_state_at(&state.text, position);
        let current = char_at(&state.text, position);
        let previous = previous_non_whitespace(&state.text, position);
        let next = next_non_whitespace(&state.text, position);

        if lexical.in_string {
            if !lexical.escaped
                && (position == state.text.len()
                    || next.is_some_and(|ch| matches!(ch, ',' | ':' | '}' | ']')))
            {
                push_insert(
                    state,
                    &mut neighbors,
                    position,
                    "\"",
                    JsonSyntaxRepairKind::InsertMissingStringQuote,
                );
            }
            if lexical.escaped && position == state.text.len() {
                push_insert(
                    state,
                    &mut neighbors,
                    position,
                    "\\",
                    JsonSyntaxRepairKind::EscapeStringControlCharacter,
                );
            }
            if current.is_some_and(|ch| ch < '\u{20}') {
                push_control_escape(state, &mut neighbors, position, current.unwrap());
            }
            continue;
        }

        if let Some(closing) = current.filter(|ch| matches!(ch, '}' | ']')) {
            match lexical.stack.last().copied() {
                Some(opening) if matching_closer(opening) != closing => {
                    push_insert(
                        state,
                        &mut neighbors,
                        position,
                        &matching_closer(opening).to_string(),
                        JsonSyntaxRepairKind::InsertMissingDelimiter,
                    );
                    push_replace_char(
                        state,
                        &mut neighbors,
                        position,
                        matching_closer(opening),
                        JsonSyntaxRepairKind::ReplaceMismatchedDelimiter,
                    );
                }
                None => push_remove_char(
                    state,
                    &mut neighbors,
                    position,
                    JsonSyntaxRepairKind::RemoveExtraToken,
                ),
                _ => {}
            }
        }
        if current == Some(',') {
            if let Some(opening) = lexical.stack.last().copied() {
                push_insert(
                    state,
                    &mut neighbors,
                    position,
                    &matching_closer(opening).to_string(),
                    JsonSyntaxRepairKind::InsertMissingDelimiter,
                );
            }
        }

        if position == state.text.len() {
            if let Some(opening) = lexical.stack.last().copied() {
                push_insert(
                    state,
                    &mut neighbors,
                    position,
                    &matching_closer(opening).to_string(),
                    JsonSyntaxRepairKind::InsertMissingDelimiter,
                );
            }
        }

        if previous.is_some_and(can_end_json_value) && next.is_some_and(can_start_json_value) {
            push_insert(
                state,
                &mut neighbors,
                position,
                ",",
                JsonSyntaxRepairKind::InsertMissingComma,
            );
        }
        if previous.is_some_and(|ch| ch == '"' || is_bare_token_character(ch))
            && next.is_some_and(can_start_json_value)
        {
            push_insert(
                state,
                &mut neighbors,
                position,
                ":",
                JsonSyntaxRepairKind::InsertMissingColon,
            );
        }
        if previous.is_some_and(|ch| matches!(ch, ':' | '[' | ',')) {
            if current == Some('"') && quoted_token_is_followed_by_colon(&state.text, position) {
                push_insert(
                    state,
                    &mut neighbors,
                    position,
                    "{",
                    JsonSyntaxRepairKind::InsertMissingDelimiter,
                );
            }
            if current.is_some_and(can_start_json_value) {
                push_insert(
                    state,
                    &mut neighbors,
                    position,
                    "[",
                    JsonSyntaxRepairKind::InsertMissingDelimiter,
                );
            }
        }

        if let Some(comma_position) = previous_non_whitespace_position(&state.text, position)
            .filter(|offset| char_at(&state.text, *offset) == Some(','))
            .filter(|_| current.is_some_and(|ch| matches!(ch, '}' | ']')))
        {
            push_remove_char(
                state,
                &mut neighbors,
                comma_position,
                JsonSyntaxRepairKind::RemoveExtraToken,
            );
        }

        if current.is_some_and(|ch| matches!(ch, ',' | ':' | '{' | '[' | '}' | ']')) {
            push_remove_char(
                state,
                &mut neighbors,
                position,
                JsonSyntaxRepairKind::RemoveExtraToken,
            );
        }
    }

    for &position in &positions {
        if char_at(&state.text, position) == Some('"') {
            let before = lexical_state_at(&state.text, position);
            if before.in_string && !before.escaped {
                push_insert(
                    state,
                    &mut neighbors,
                    position,
                    "\\",
                    JsonSyntaxRepairKind::EscapeStringQuote,
                );
            }
        }
        push_normalized_quoted_token(state, &mut neighbors, position);
        push_quoted_bare_token(state, &mut neighbors, position);
    }

    if state.text[..center.min(state.text.len())]
        .chars()
        .all(char::is_whitespace)
    {
        push_insert(
            state,
            &mut neighbors,
            center.min(state.text.len()),
            "{",
            JsonSyntaxRepairKind::InsertMissingDelimiter,
        );
        push_insert(
            state,
            &mut neighbors,
            center.min(state.text.len()),
            "[",
            JsonSyntaxRepairKind::InsertMissingDelimiter,
        );
    }
    if let Some(first_non_whitespace) = state
        .text
        .char_indices()
        .find(|(_, character)| !character.is_whitespace())
        .map(|(offset, _)| offset)
    {
        if char_at(&state.text, first_non_whitespace) == Some('"') {
            push_insert(
                state,
                &mut neighbors,
                first_non_whitespace,
                "{",
                JsonSyntaxRepairKind::InsertMissingDelimiter,
            );
        }
    }

    neighbors
}

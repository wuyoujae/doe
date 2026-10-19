// Origin: app/backend/core/src/slide_recovery/mod.rs::unique_embedded_deck_object


pub(super) fn unique_embedded_deck_object(raw: &str) -> Result<Option<&str>, String> {
    let mut candidates = Vec::new();
    let mut start = None;
    let mut stack = Vec::new();
    let mut in_string = false;
    let mut escaped = false;
    for (index, character) in raw.char_indices() {
        if start.is_none() {
            if character == '{' {
                start = Some(index);
                stack.push('}');
            }
            continue;
        }
        if in_string {
            if escaped {
                escaped = false;
            } else if character == '\\' {
                escaped = true;
            } else if character == '"' {
                in_string = false;
            }
            continue;
        }
        match character {
            '"' => in_string = true,
            '{' => stack.push('}'),
            '[' => stack.push(']'),
            '}' | ']' if stack.last() == Some(&character) => {
                stack.pop();
                if stack.is_empty() {
                    let begin = start.take().expect("embedded object start");
                    let end = index + character.len_utf8();
                    let candidate = &raw[begin..end];
                    if candidate.contains("\"version\"")
                        && candidate.contains("\"deck\"")
                        && candidate.contains("\"slides\"")
                    {
                        candidates.push(candidate);
                    }
                }
            }
            _ => {}
        }
    }
    if candidates.len() > 1 {
        return Err("slide_recovery_ambiguous_embedded_json_objects".to_string());
    }
    let Some(candidate) = candidates.pop() else {
        return Ok(None);
    };
    if candidate.trim().len() == raw.trim().len() {
        Ok(None)
    } else {
        Ok(Some(candidate))
    }
}

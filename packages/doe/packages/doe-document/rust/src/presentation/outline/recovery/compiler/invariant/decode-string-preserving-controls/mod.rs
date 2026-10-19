// Origin: app/backend/core/src/outline_recovery/compiler/invariant.rs::decode_string_preserving_controls


pub(super) fn decode_string_preserving_controls(lexeme: &str) -> Option<String> {
    if let Ok(value) = serde_json::from_str::<String>(lexeme) {
        return Some(value);
    }
    let mut escaped = String::with_capacity(lexeme.len());
    let mut in_string = false;
    let mut after_escape = false;
    for character in lexeme.chars() {
        if !in_string {
            escaped.push(character);
            if character == '"' {
                in_string = true;
            }
            continue;
        }
        if after_escape {
            escaped.push(character);
            after_escape = false;
        } else if character == '\\' {
            escaped.push(character);
            after_escape = true;
        } else if character == '"' {
            escaped.push(character);
            in_string = false;
        } else if character < '\u{20}' {
            match character {
                '\n' => escaped.push_str("\\n"),
                '\r' => escaped.push_str("\\r"),
                '\t' => escaped.push_str("\\t"),
                '\u{08}' => escaped.push_str("\\b"),
                '\u{0c}' => escaped.push_str("\\f"),
                _ => escaped.push_str(&format!("\\u{:04x}", character as u32)),
            }
        } else {
            escaped.push(character);
        }
    }
    serde_json::from_str::<String>(&escaped).ok()
}

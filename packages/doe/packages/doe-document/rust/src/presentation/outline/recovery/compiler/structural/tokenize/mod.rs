// Origin: app/backend/core/src/outline_recovery/compiler/structural.rs::tokenize
use super::*;


pub(super) fn tokenize(source: &str) -> Result<Vec<Token>, String> {
    let bytes = source.as_bytes();
    let mut tokens = Vec::new();
    let mut cursor = 0usize;
    while cursor < bytes.len() {
        let start = cursor;
        let byte = bytes[cursor];
        if byte.is_ascii_whitespace() {
            cursor += 1;
            continue;
        }
        let simple = match byte {
            b'{' => Some(TokenKind::ObjectStart),
            b'}' => Some(TokenKind::ObjectEnd),
            b'[' => Some(TokenKind::ArrayStart),
            b']' => Some(TokenKind::ArrayEnd),
            b':' => Some(TokenKind::Colon),
            b',' => Some(TokenKind::Comma),
            _ => None,
        };
        if let Some(kind) = simple {
            cursor += 1;
            tokens.push(Token { kind, start });
            continue;
        }
        if byte == b'"' {
            cursor += 1;
            let mut escaped = false;
            while cursor < bytes.len() {
                let current = bytes[cursor];
                cursor += 1;
                if escaped {
                    escaped = false;
                } else if current == b'\\' {
                    escaped = true;
                } else if current == b'"' {
                    break;
                }
            }
            if cursor > bytes.len() || bytes.get(cursor.saturating_sub(1)) != Some(&b'"') {
                return Err(format!("unterminated JSON string at byte {start}"));
            }
            tokens.push(Token {
                kind: TokenKind::String,
                start,
            });
            continue;
        }
        while cursor < bytes.len()
            && !bytes[cursor].is_ascii_whitespace()
            && !matches!(
                bytes[cursor],
                b'{' | b'}' | b'[' | b']' | b':' | b',' | b'"'
            )
        {
            cursor += 1;
        }
        if cursor == start {
            return Err(format!("invalid JSON token at byte {start}"));
        }
        tokens.push(Token {
            kind: TokenKind::Atom,
            start,
        });
    }
    Ok(tokens)
}

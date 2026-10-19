// Origin: app/backend/core/src/slide_agent_output_contract.rs::repair_missing_structural_key_quotes
use super::*;


pub(super) fn repair_missing_structural_key_quotes(raw: &str) -> Option<String> {
    let bytes = raw.as_bytes();
    let mut repaired = Vec::with_capacity(bytes.len() + MAX_JSON_KEY_QUOTE_REPAIRS);
    let mut stack = Vec::<u8>::new();
    let mut in_string = false;
    let mut escaped = false;
    let mut previous_significant = None;
    let mut repairs = 0usize;
    let mut index = 0usize;

    while index < bytes.len() {
        let byte = bytes[index];
        if in_string {
            repaired.push(byte);
            if escaped {
                escaped = false;
            } else if byte == b'\\' {
                escaped = true;
            } else if byte == b'"' {
                in_string = false;
                previous_significant = Some(byte);
            }
            index += 1;
            continue;
        }

        if byte == b'"' {
            in_string = true;
            repaired.push(byte);
            previous_significant = Some(byte);
            index += 1;
            continue;
        }

        if stack.last() == Some(&b'{')
            && matches!(previous_significant, Some(b'{') | Some(b','))
            && byte.is_ascii_alphabetic()
        {
            let key_start = index;
            let mut key_end = index;
            while key_end < bytes.len()
                && (bytes[key_end].is_ascii_alphanumeric() || bytes[key_end] == b'_')
            {
                key_end += 1;
            }
            if key_end < bytes.len() && bytes[key_end] == b'"' {
                let mut colon = key_end + 1;
                while colon < bytes.len() && bytes[colon].is_ascii_whitespace() {
                    colon += 1;
                }
                let key = std::str::from_utf8(&bytes[key_start..key_end]).ok();
                if bytes.get(colon) == Some(&b':')
                    && key.is_some_and(|key| STRUCTURAL_JSON_KEYS.contains(&key))
                    && repairs < MAX_JSON_KEY_QUOTE_REPAIRS
                {
                    repaired.push(b'"');
                    repaired.extend_from_slice(&bytes[key_start..=key_end]);
                    previous_significant = Some(b'"');
                    repairs += 1;
                    index = key_end + 1;
                    continue;
                }
            }
        }

        match byte {
            b'{' | b'[' => stack.push(byte),
            b'}' if stack.last() == Some(&b'{') => {
                stack.pop();
            }
            b']' if stack.last() == Some(&b'[') => {
                stack.pop();
            }
            _ => {}
        }
        repaired.push(byte);
        if !byte.is_ascii_whitespace() {
            previous_significant = Some(byte);
        }
        index += 1;
    }

    (repairs > 0).then(|| String::from_utf8(repaired).expect("repair preserves UTF-8"))
}

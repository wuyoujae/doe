// Origin: app/backend/core/src/outline_recovery/compiler/lexical.rs::balanced_json_root_end


pub(super) fn balanced_json_root_end(source: &str, start: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut stack = vec![match *bytes.get(start)? {
        b'{' => b'}',
        b'[' => b']',
        _ => return None,
    }];
    let mut in_string = false;
    let mut escaped = false;
    let mut cursor = start + 1;
    while cursor < bytes.len() {
        let byte = bytes[cursor];
        if in_string {
            if escaped {
                escaped = false;
            } else if byte == b'\\' {
                escaped = true;
            } else if byte == b'"' {
                in_string = false;
            }
        } else {
            match byte {
                b'"' => in_string = true,
                b'{' => stack.push(b'}'),
                b'[' => stack.push(b']'),
                b'}' | b']' if stack.last() == Some(&byte) => {
                    stack.pop();
                    if stack.is_empty() {
                        return Some(cursor + 1);
                    }
                }
                b'}' | b']' => return None,
                _ => {}
            }
        }
        cursor += 1;
    }
    None
}

// Origin: app/backend/core/src/slide_agent_output_contract.rs::repair_missing_json_delimiters
use super::*;


pub(super) fn repair_missing_json_delimiters(raw: &str) -> Option<String> {
    let mut repaired = String::with_capacity(raw.len() + MAX_JSON_DELIMITER_REPAIRS);
    let mut stack = Vec::<char>::new();
    let mut in_string = false;
    let mut escaped = false;
    let mut repairs = 0usize;

    for character in raw.chars() {
        if in_string {
            repaired.push(character);
            if escaped {
                escaped = false;
            } else if character == '\\' {
                escaped = true;
            } else if character == '"' {
                in_string = false;
            }
            continue;
        }

        if character == '"' {
            in_string = true;
            repaired.push(character);
            continue;
        }
        if matches!(character, '{' | '[') {
            stack.push(character);
            repaired.push(character);
            continue;
        }
        if matches!(character, '}' | ']') {
            let expected_open = if character == '}' { '{' } else { '[' };
            while stack.last().is_some_and(|open| *open != expected_open) {
                if repairs >= MAX_JSON_DELIMITER_REPAIRS {
                    return None;
                }
                repaired.push(match stack.pop()? {
                    '{' => '}',
                    '[' => ']',
                    _ => return None,
                });
                repairs += 1;
            }
            if stack.pop()? != expected_open {
                return None;
            }
            repaired.push(character);
            continue;
        }
        repaired.push(character);
    }

    if in_string || escaped {
        return None;
    }
    while let Some(open) = stack.pop() {
        if repairs >= MAX_JSON_DELIMITER_REPAIRS {
            return None;
        }
        repaired.push(match open {
            '{' => '}',
            '[' => ']',
            _ => return None,
        });
        repairs += 1;
    }
    (repairs > 0).then_some(repaired)
}

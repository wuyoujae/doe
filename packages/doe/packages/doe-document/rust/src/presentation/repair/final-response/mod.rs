//! Select a provider-declared final document before repairing JSON syntax.
//! The declaration is framing data, never an instruction to execute or edit content.

pub(super) fn select(raw: &str) -> Result<Option<&str>, String> {
    let mut quoted = false;
    let mut escaped = false;
    let mut offset = 0;
    let mut selected = None;
    for line in raw.split_inclusive('\n') {
        if !quoted && is_final_label(line.trim()) {
            if selected.is_some() {
                return Err(invalid("multiple final declarations"));
            }
            selected = Some(offset + line.len());
        }
        for ch in line.chars() {
            if quoted {
                if escaped {
                    escaped = false;
                } else if ch == '\\' {
                    escaped = true;
                } else if ch == '"' {
                    quoted = false;
                }
            } else if ch == '"' {
                quoted = true;
            }
        }
        offset += line.len();
    }
    let Some(start) = selected else {
        return Ok(None);
    };
    let candidate = raw[start..].trim();
    if !candidate.starts_with('{')
        && !candidate
            .get(..7)
            .is_some_and(|s| s.eq_ignore_ascii_case("```json"))
    {
        return Err(invalid(
            "final declaration must be followed by a JSON document",
        ));
    }
    Ok(Some(candidate))
}

fn is_final_label(line: &str) -> bool {
    let label = line.trim_start_matches('#').trim();
    let label = label
        .strip_prefix("**")
        .and_then(|s| s.strip_suffix("**"))
        .unwrap_or(label);
    let Some(label) = label.strip_suffix([':', '：']) else {
        return false;
    };
    matches!(
        label.trim().to_ascii_lowercase().as_str(),
        "final corrected json"
            | "final json"
            | "corrected final json"
            | "最终修正后的 json"
            | "最终修正版 json"
            | "最终 json"
            | "最终版 json"
    )
}

fn invalid(detail: &str) -> String {
    format!("slide_agent_invalid_json: {detail}")
}

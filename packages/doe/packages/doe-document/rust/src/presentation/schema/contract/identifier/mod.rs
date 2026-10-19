// Origin: app/backend/core/src/slide_agent_output_contract.rs::identifier
use super::*;


pub(super) fn identifier<'a>(value: &'a Value, path: &str) -> Result<&'a str, String> {
    let value = nonempty_text(value, path)?;
    if value.chars().any(char::is_control) || value.chars().count() > 128 {
        return mismatch(format!("{path} is too long")).map(|_| unreachable!());
    }
    Ok(value)
}

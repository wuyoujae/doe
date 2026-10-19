// Origin: app/backend/core/src/slide_agent_output_contract.rs::nonempty_text
use crate::schema::*;


pub fn nonempty_text<'a>(value: &'a Value, path: &str) -> Result<&'a str, String> {
    let value = value
        .as_str()
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| format!("{SCHEMA_MISMATCH_ERROR}: {path} must be a non-empty string"))?;
    if value.contains('\0') || value.chars().count() > 20_000 {
        return mismatch(format!("{path} contains invalid or excessive text"))
            .map(|_| unreachable!());
    }
    Ok(value)
}

// Origin: app/backend/core/src/slide_agent_output_contract/contents.rs::present
use super::*;


pub(super) fn present(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Array(a)) => !a.is_empty(),
        _ => true,
    }
}

// Origin: app/backend/core/src/outline_agent_output_contract.rs::derived_page_number_is_valid
use super::*;


pub(super) fn derived_page_number_is_valid(path: &str, value: &Value) -> bool {
    let Some(prefix) = path.strip_prefix("/outline/slides/") else {
        return false;
    };
    let Some(index) = prefix.strip_suffix("/page_number") else {
        return false;
    };
    index
        .parse::<i64>()
        .ok()
        .is_some_and(|index| value.as_i64() == Some(index + 1))
}

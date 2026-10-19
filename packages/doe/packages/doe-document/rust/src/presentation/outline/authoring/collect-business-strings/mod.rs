// Origin: app/backend/core/src/outline_agent_output_contract.rs::collect_business_strings
use super::*;


pub(super) fn collect_business_strings(value: &Value, key: Option<&str>, strings: &mut Vec<String>) {
    if key.is_some_and(|key| {
        matches!(
            key,
            "request_debug" | "provider_debug" | "transport_metadata" | "page_count_hint"
        )
    }) {
        return;
    }
    match value {
        Value::String(value)
            if !value.trim().is_empty()
                && !key.is_some_and(|key| matches!(key, "operation" | "type" | "ratio")) =>
        {
            strings.push(value.clone());
        }
        Value::Array(values) => {
            for value in values {
                collect_business_strings(value, None, strings);
            }
        }
        Value::Object(values) => {
            for (key, value) in values {
                collect_business_strings(value, Some(key), strings);
            }
        }
        _ => {}
    }
}

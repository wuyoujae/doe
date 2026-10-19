// Origin: app/backend/core/src/outline_agent_output_contract.rs::business_string_multiset_hash
use super::*;


pub(super) fn business_string_multiset_hash(value: &Value) -> String {
    let mut strings = Vec::new();
    collect_business_strings(value, None, &mut strings);
    strings.sort_unstable();
    let encoded = strings
        .into_iter()
        .map(|value| format!("{}:{value}", value.len()))
        .collect::<Vec<_>>()
        .join("|");
    outline_recovery::diagnostics::sha256_hex(encoded.as_bytes())
}

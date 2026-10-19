// Origin: app/backend/core/src/slide_agent_output_contract.rs::is_canonical_stable_asset_reference
use super::*;


pub(super) fn is_canonical_stable_asset_reference(value: &str) -> bool {
    stable_asset_reference_parts(value)
        .is_some_and(|(_, suffix)| suffix.len() == 64 && suffix.bytes().all(is_lower_hex_byte))
}

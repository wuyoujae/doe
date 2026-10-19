// Origin: app/backend/core/src/slide_agent_output_contract.rs::stable_asset_reference_parts
use super::*;


pub(super) fn stable_asset_reference_parts(value: &str) -> Option<(&str, &str)> {
    STABLE_ASSET_REFERENCE_PREFIXES
        .iter()
        .find_map(|prefix| value.strip_prefix(prefix).map(|suffix| (*prefix, suffix)))
}

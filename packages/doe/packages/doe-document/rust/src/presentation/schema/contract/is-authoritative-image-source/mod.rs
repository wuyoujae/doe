// Origin: app/backend/core/src/slide_agent_output_contract.rs::is_authoritative_image_source
use super::*;


pub(super) fn is_authoritative_image_source(value: &str) -> bool {
    is_canonical_stable_asset_reference(value) || value.starts_with("https://")
}

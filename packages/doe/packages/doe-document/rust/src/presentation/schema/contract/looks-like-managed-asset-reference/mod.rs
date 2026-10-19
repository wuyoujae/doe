// Origin: app/backend/core/src/slide_agent_output_contract.rs::looks_like_managed_asset_reference


pub(super) fn looks_like_managed_asset_reference(value: &str) -> bool {
    value.starts_with("yrkie-asset-")
}

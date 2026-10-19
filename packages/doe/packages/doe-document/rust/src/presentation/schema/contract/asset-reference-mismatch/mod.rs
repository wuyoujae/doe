// Origin: app/backend/core/src/slide_agent_output_contract.rs::asset_reference_mismatch
use super::*;


pub(super) fn asset_reference_mismatch() -> String {
    format!("{ASSET_REFERENCE_MISMATCH_ERROR}: Deck contains an unknown or ambiguous image source")
}

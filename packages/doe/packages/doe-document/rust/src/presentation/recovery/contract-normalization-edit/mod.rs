// Origin: app/backend/core/src/slide_recovery/mod.rs::contract_normalization_edit
use super::*;


pub(super) fn contract_normalization_edit(
    before: &Value,
    after: &Value,
    image_source_repair_count: usize,
) -> SlideRepairEdit {
    SlideRepairEdit {
        code: "contract.normalization_unique".to_string(),
        path: "root".to_string(),
        action: format!(
            "apply_unique_contract_normalization:image_source_repairs={image_source_repair_count}"
        ),
        page_index: None,
        before_sha256: canonical_value_sha256(before),
        after_sha256: canonical_value_sha256(after),
        constraint: "only canonical Deck controls, legacy field placement, redundant fixed canvas, and uniquely matched authoritative image sources may change"
            .to_string(),
    }
}

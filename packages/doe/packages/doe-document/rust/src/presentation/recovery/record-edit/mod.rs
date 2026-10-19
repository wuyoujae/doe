// Origin: app/backend/core/src/slide_recovery/mod.rs::record_edit
use super::*;


#[allow(clippy::too_many_arguments)]
pub(super) fn record_edit(
    edits: &mut Vec<SlideRepairEdit>,
    code: &str,
    path: &str,
    action: &str,
    page_index: Option<usize>,
    before: &Value,
    after: &Value,
    constraint: &str,
) {
    edits.push(SlideRepairEdit {
        code: code.to_string(),
        path: path.to_string(),
        action: action.to_string(),
        page_index,
        before_sha256: canonical_value_sha256(before),
        after_sha256: canonical_value_sha256(after),
        constraint: constraint.to_string(),
    });
}

// Origin: app/backend/core/src/slide_recovery/tests.rs::ambiguous_or_wrong_page_count_json_is_not_repaired
use super::*;


#[test]
pub(super) fn ambiguous_or_wrong_page_count_json_is_not_repaired() {
    let one = deck(vec![valid_slide("slide-1", "One")]);
    let raw = format!("```json\n{}\n```", one);
    assert!(recover_agent_deck(&raw, expectations(2), &[]).is_err());
}

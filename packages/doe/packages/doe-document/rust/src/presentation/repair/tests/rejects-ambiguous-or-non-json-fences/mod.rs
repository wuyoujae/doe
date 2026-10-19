// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::rejects_ambiguous_or_non_json_fences
use super::*;


#[test]
pub(super) fn rejects_ambiguous_or_non_json_fences() {
    let raw = valid_deck(r#""invalid wrapper""#);
    for wrapped in [
        format!("```\n{raw}\n```"),
        format!("```javascript\n{raw}\n```"),
        format!("```json\n{raw}"),
        format!("```json\n{raw}\n```\ntrailing"),
        format!("```json\n```json\n{raw}\n```\n```"),
    ] {
        assert!(
            process_one(&wrapped, true)
                .unwrap_err()
                .starts_with("slide_auto_repair_v2_json_code_fence_invalid"),
            "{wrapped}"
        );
    }
}

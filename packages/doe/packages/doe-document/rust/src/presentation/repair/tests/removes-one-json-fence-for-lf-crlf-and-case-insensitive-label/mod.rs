// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::removes_one_json_fence_for_lf_crlf_and_case_insensitive_label
use super::*;


#[test]
pub(super) fn removes_one_json_fence_for_lf_crlf_and_case_insensitive_label() {
    let raw = valid_deck(r#""fenced""#);
    for wrapped in [
        format!("```json\n{raw}\n```"),
        format!(" \r\n```JSON\r\n{raw}\r\n```\r\n "),
    ] {
        let processed = process_one(&wrapped, true).unwrap();
        assert_eq!(
            processed.proof.operations,
            vec![SlideAutoRepairV2Operation::JsonCodeFenceRemoved]
        );
        assert_eq!(processed.proof.output_bytes, raw.len());
        assert_eq!(processed.parsed.slides.len(), 1);
    }
}

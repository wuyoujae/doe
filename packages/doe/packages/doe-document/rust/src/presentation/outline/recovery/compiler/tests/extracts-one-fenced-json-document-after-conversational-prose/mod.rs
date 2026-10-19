// Origin: app/backend/core/src/outline_recovery/compiler/tests.rs::extracts_one_fenced_json_document_after_conversational_prose
use super::*;


#[test]
pub(super) fn extracts_one_fenced_json_document_after_conversational_prose() {
    let raw = "我来为您构建完整大纲。\n\n```json\n{\"items\":[{\"name\":\"星曜科技 2026 年度经营汇报\"}]}\n```";
    let compiled = compile_json(raw, |_| Some(0)).expect("compile wrapped provider output");
    assert_eq!(
        compiled.value["items"][0]["name"],
        "星曜科技 2026 年度经营汇报"
    );
    assert!(compiled.proof.business_string_invariant_passed);
    assert!(compiled
        .diagnostics
        .findings
        .iter()
        .any(|finding| finding.code == "framing.wrapper.removed"));
    assert_eq!(compiled.proof.edits.len(), 2);
}
